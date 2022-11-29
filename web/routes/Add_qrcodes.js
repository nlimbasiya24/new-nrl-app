import express from "express" 
import {qrcode_model} from "../models/Qr_codes.js";
import crypto from "crypto";
const router=express.Router();
import { Shopify } from "@shopify/shopify-api";
import {
  getShopUrlFromSession,
  getQrCodeOr404,
  parseQrCodeBody,
  formatQrCodeResponse,
} from "../helpers/qr-codes.js";

const DISCOUNTS_QUERY = `
  query discounts($first: Int!) {
    codeDiscountNodes(first: $first) {
      edges {
        node {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
            ... on DiscountCodeBxgy {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
            ... on DiscountCodeFreeShipping {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

	
 router.get("/discounts", async (req, res) => {
   const session = await Shopify.Utils.loadCurrentSession(
     req,
     res,
     false
   );

   if (!session) {
     res.status(401).send("Could not find a Shopify session");
     return;
   }

   const client = new Shopify.Clients.Graphql(
     session.shop,
     session.accessToken
   );

   /* Fetch all available discounts to list in the QR code form */
   const discounts = await client.query({
     data: {
       query: DISCOUNTS_QUERY,
       variables: {
         first: 25,
       },
     },
   });

   res.send(discounts.body.data);
 });
   


router.post("/qrcodes", async (req, res) => {
  try {
    
    //console.log("ShopDoamain",shopDomain)
    const {
      title,
      productId,
      variantId,
      handle,
      discountId,
      discountCode,
      destination,
    } = req.body;
      
    const qrcode = new qrcode_model({
      shopDomain: await getShopUrlFromSession(req, res),
      title,
      productId,
      variantId,
      handle,
      discountId,
      discountCode,
      destination,
      scans:0,
    });
    
    
     const saveqrcode = await qrcode.save();

     res.status(201).send(saveqrcode);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server error");
  }
});
router.patch("/qrcodes/:id", async (req, res) => {
  const qrcode = await getQrCodeOr404(req, res);
  if (qrcode) {
      try {
        await qrcode_model.findByIdAndUpdate(req.params.id,await parseQrCodeBody(req));
        const response = await formatQrCodeResponse(req, res, [
          await qrcode_model.findByIdAndUpdate({_id:req.params.id}),
        ]);
        res.status(200).send(response);
      } catch (error) {
        res.status(500).send(error.message);
      }
    }
  });
router.get("/qrcodes", async (req, res) => {
      try {
          const shop_name=await getShopUrlFromSession(req, res);
        const rawCodeData = await qrcode_model.find({ shopDomain:shop_name });
  
        const response = await formatQrCodeResponse(req, res, rawCodeData);
      
        res.status(200).send(response);
      } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
      }
    });
     router.get("/qrcodes/:id", async (req, res) => {
      console.log("getttogn")
       const qrcode = await getQrCodeOr404(req, res);
      //  console.log("qrcode",qrcode);

       if (qrcode) {
         const formattedQrCode = await formatQrCodeResponse(req, res, [qrcode]);
        
         res.status(200).send(formattedQrCode[0]);
       }
     });
    	router.delete("/qrcodes/:id", async (req, res) => {
        const qrcode = await getQrCodeOr404(req, res);
       

        if (qrcode) {
          await qrcode_model.findByIdAndDelete({_id:req.params.id});
          res.status(200).send();
        }
      });
     router.post("/reviews", async (req, res) => {
       console.log("Request Body", req.body);
     });
    

  
    

export default router
