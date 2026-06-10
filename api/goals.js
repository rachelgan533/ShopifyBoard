module.exports = async function handler(req, res) {
  try {
    assertEnv();

    if (req.method === "GET") {
      const [goals, shops] = await Promise.all([
        supabaseFetch(
          "/rest/v1/goals?select=id,shop_id,name,description,start_date,end_date,target_gmv,status,is_active,created_at,updated_at&order=start_date.desc",
        ),
        supabaseFetch("/rest/v1/shops?select=id,shop_domain,shop_name&order=updated_at.desc&limit=1"),
      ]);
      return res.status(200).json({
        ok: true,
        goals,
        active_goal: goals.find((goal) => goal.is_active || goal.status === "active") || null,
        primary_shop: shops[0] || null,
      });
    }

    if (req.method === "POST") {
      assertAuthorized(req);
      const body = await readJson(req);
      const action = String(body.action || "save").trim();

      if (action === "delete") {
        const id = String(body.id || "").trim();
        if (!id) return res.status(400).json({ error: "Missing goal id" });
        await supabaseFetch(`/rest/v1/goals?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { prefer: "return=minimal" },
        });
        return res.status(200).json({ ok: true, deleted: id });
      }

      const id = String(body.id || "").trim();
      const current = id ? await getGoal(id) : null;
      const row = normalizeGoalBody(body, current);
      const shopId = await resolveShopId(current?.shop_id);

      if (row.is_active || row.status === "active") {
        await supabaseFetch("/rest/v1/goals?is_active=eq.true", {
          method: "PATCH",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify({ is_active: false, status: "inactive" }),
        });
      }

      const payload = {
        ...(shopId ? { shop_id: shopId } : {}),
        name: row.name,
        description: row.description,
        start_date: row.start_date,
        end_date: row.end_date,
        target_gmv: row.target_gmv,
        status: row.status,
        is_active: row.is_active,
      };

      if (current?.id) {
        await supabaseFetch(`/rest/v1/goals?id=eq.${encodeURIComponent(current.id)}`, {
          method: "PATCH",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify(payload),
        });
      } else {
        await supabaseFetch("/rest/v1/goals", {
          method: "POST",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify([payload]),
        });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Goals request failed",
      details: error.details,
    });
  }
};

function assertEnv() {
  const missing = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

function assertAuthorized(req) {
  if (!process.env.CRON_SECRET) return;

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query?.secret;

  if (token !== process.env.CRON_SECRET) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
}

async function getGoal(id) {
  const rows = await supabaseFetch(`/rest/v1/goals?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows[0] || null;
}

async function resolveShopId(existingShopId) {
  if (existingShopId) return existingShopId;
  const shops = await supabaseFetch("/rest/v1/shops?select=id&order=updated_at.desc&limit=1");
  return shops[0]?.id || null;
}

function normalizeGoalBody(body, current) {
  const name = String(body.name || current?.name || "").trim();
  const startDate = String(body.start_date || current?.start_date || "").trim();
  const endDate = String(body.end_date || current?.end_date || "").trim();
  const targetGmv = Number(body.target_gmv ?? current?.target_gmv ?? 0);
  const isActive = body.is_active === true || body.is_active === "true" || body.status === "active";
  const status = String(body.status || (isActive ? "active" : current?.status || "draft")).trim();

  if (!name) {
    const error = new Error("Missing goal name");
    error.statusCode = 400;
    throw error;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    const error = new Error("Invalid goal date range");
    error.statusCode = 400;
    throw error;
  }
  if (startDate > endDate) {
    const error = new Error("Start date must be on or before end date");
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isFinite(targetGmv) || targetGmv <= 0) {
    const error = new Error("Target GMV must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  return {
    name,
    description: String(body.description || current?.description || "").trim(),
    start_date: startDate,
    end_date: endDate,
    target_gmv: targetGmv,
    status: isActive ? "active" : status === "active" ? "inactive" : status,
    is_active: isActive,
  };
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};

  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${trimSlash(process.env.SUPABASE_URL)}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error("Supabase request failed");
    error.statusCode = response.status;
    error.details = body;
    throw error;
  }

  return body || [];
}

function trimSlash(value) {
  return String(value || "").replace(/\/$/, "");
}
