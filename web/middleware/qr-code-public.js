/*
  Merchants need to be able to scan the QR Codes.
  This file provides the publicly available URLs to do that.
*/
import QRCode from "qrcode";
import { Shopify } from "@shopify/shopify-api";
import { qrcode_model } from "../models/Qr_codes.js"
import { getQrCodeOr404 } from "../helpers/qr-codes.js";

const DEFAULT_PURCHASE_QUANTITY = 1;
export default function applyQrCodePublicEndpoints(app) {
  /*
    The URL for a QR code image.
    The image is generated dynamically so that merhcanges can change the configuration for a QR code.
    This way changes to the QR code won't break the redirection.
  */
  app.get("/api/:id/image", async (req, res) => {
   console.log("sfsfsdfsdfsdfsf");
    
   const qrcode = await getQrCodeOr404(req, res, false);

   console.log("QrCOde",qrcode);

    if (qrcode) {
      const destinationUrl = generateQrcodeDestinationUrl(qrcode);

      console.log("Destination Url",destinationUrl)
    
      res
        .status(200)
        .set("Content-Type", "image/png")
        .set(
          "Content-Disposition",
          `inline; filename="qr_code_${qrcode._id}.png"`
        )
        .send(await QRCode.toBuffer(destinationUrl));
    }
  });

  function generateQrcodeDestinationUrl (qrcode){
    	return `${Shopify.Context.HOST_SCHEME}://${Shopify.Context.HOST_NAME}/api/${qrcode.id}/scan`;
  }


  /* The URL customers are taken to when they scan the QR code */
  app.get("/api/:id/scan", async (req, res) => {

 
    const qrcode = await getQrCodeOr404(req, res, false);

    if (qrcode) {
      res.redirect(await handleCodeScan(qrcode));
    }
  });

 async function handleCodeScan (qrcode){

    await increaseScanCount(qrcode);

     const url = new URL(qrcode.shopDomain);
    switch (qrcode.destination) {
      case "product":
        return goToProductView(url, qrcode);
      case "checkout":
        return goToProductCheckout(url, qrcode);
    }
 }

 async function increaseScanCount(qrcode) {

   await qrcode_model.findByIdAndUpdate(
    { _id: qrcode._id },
    { scans:qrcode.scans + 1}
  );
 }

 function goToProductView(url, qrcode){
    return productViewURL({
      discountCode: qrcode.discountCode,
      host: url.toString(),
      productHandle: qrcode.handle,
    });
  }

  function productViewURL({host, productHandle, discountCode}){
    const url = new URL(host);
    const productPath = `/products/${productHandle}`;
    
    url.pathname = productPath;
    return url.toString();
  }

  function goToProductCheckout(url,qrcode){
     return productCheckoutURL({
       discountCode: qrcode.discountCode,
       host: url.toString(),
       variantId: qrcode.variantId,
       quantity: DEFAULT_PURCHASE_QUANTITY,
     });
  }
   function productCheckoutURL({
     host,
     variantId,
     quantity = 1,
     discountCode,
   }) {
     const url = new URL(host);
     const id = variantId.replace(
       /gid:\/\/shopify\/ProductVariant\/([0-9]+)/,
       "$1"
     );

     /* The cart URL resolves to a checkout URL */
     url.pathname = `/cart/${id}:${quantity}`;

    //  if (discountCode) {
    //    url.searchParams.append("discount", discountCode);
    //  }

     return url.toString();
   }
 }

