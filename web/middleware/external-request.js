import crypto from "crypto";
export const external_request = (req,res, next) => {


    console.log("request",req.query);
  if (
    verifyAppProxyExtensionSignature(req.query, process.env.SHOPIFY_API_SECRET)
  ) {
    return next();
  }
  ctx.res.statusCode = 401;
};

const verifyAppProxyExtensionSignature = (query = {}, shopifyApiSecret) => {
  const { signature = "", ...otherQueryParams } = query;

  const input = Object.keys(otherQueryParams)
    .sort()
    .map((key) => {
      const value = otherQueryParams[key];
      return `${key}=${value}`;
    })
    .join("");

    console.log("Final input",input);

  const hmac = crypto
    .createHmac("sha256", shopifyApiSecret)
    .update(input)
    .digest("hex");

  const digest = Buffer.from(hmac, "utf-8");
  const checksum = Buffer.from(signature, "utf-8");

  return (
    digest.length === checksum.length &&
    crypto.timingSafeEqual(digest, checksum)
  );
};
