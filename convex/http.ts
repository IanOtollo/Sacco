import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Safaricom Daraja C2B callbacks for the paybill. Register these two URLs
// (Register URL API) as
//   <deployment>.convex.site/payments/c2b/<MPESA_C2B_SECRET>/validate
//   <deployment>.convex.site/payments/c2b/<MPESA_C2B_SECRET>/confirm
// Daraja rejects callback URLs containing words like "mpesa", hence the
// neutral path. The secret in the path is the only authentication these
// callbacks have, so it is a long random value kept as a Convex env var.
const ACCEPTED = { ResultCode: 0, ResultDesc: "Accepted" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function secretMatches(provided: string): boolean {
  const expected = process.env.MPESA_C2B_SECRET;
  return !!expected && expected.length >= 24 && provided === expected;
}

http.route({
  pathPrefix: "/payments/c2b/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const [secret, action] = new URL(request.url).pathname
      .replace("/payments/c2b/", "")
      .split("/");
    if (!secretMatches(secret ?? "")) return new Response("Not found", { status: 404 });

    // Validation is only called if Safaricom has it switched on for the
    // shortcode; we accept everything and rely on Confirmation.
    if (action === "validate") return json(ACCEPTED);
    if (action !== "confirm") return new Response("Not found", { status: 404 });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json({ ResultCode: "C2B00016", ResultDesc: "Invalid payload" }, 400);
    }

    const orgBalance = Number(body.OrgAccountBalance);
    await ctx.runMutation(internal.mpesa.mutations.recordC2B, {
      transId: String(body.TransID ?? ""),
      transTime: String(body.TransTime ?? ""),
      amount: Number(body.TransAmount),
      billRef: String(body.BillRefNumber ?? ""),
      msisdn: body.MSISDN ? String(body.MSISDN) : undefined,
      payerName: [body.FirstName, body.MiddleName, body.LastName]
        .filter(Boolean)
        .join(" "),
      orgBalance: Number.isFinite(orgBalance) ? orgBalance : undefined,
    });
    return json(ACCEPTED);
  }),
});

export default http;
