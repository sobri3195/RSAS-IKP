import { createApp } from "../server/app.js";
import { config } from "../server/config.js";
import { postgres } from "../server/db.js";
// A warm function reuses its pool. Database migrations run separately, never per request.
export default createApp(postgres(process.env.DATABASE_URL || ""), config());
