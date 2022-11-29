import { Shopify } from "@shopify/shopify-api";
import {qrcode_model} from "../models/Qr_codes.js"

const QR_CODE_ADMIN_QUERY = `
  query nodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        handle
        title
        images(first: 1) {
          edges {
            node {
              url
            }
          }
        }
      }
      ... on ProductVariant {
        id
      }
      ... on DiscountCodeNode {
        id
      }
    }
  }
`;

export async function getQrCodeOr404(req, res, checkDomain = true) {
  try {
    const response = await qrcode_model.findById({_id:req.params.id});
    if (
      response === undefined ||
      (checkDomain &&
        (await getShopUrlFromSession(req, res)) !== response.shopDomain)
    ) {
      res.status(404).send();
    } else {
      return response;
    }
  } catch (error) {
    res.status(500).send(error.message);
  }

  return undefined;
}

export async function getShopUrlFromSession(req, res) {
  const session = await Shopify.Utils.loadCurrentSession(req, res, false);
  return `https://${session.shop}`;
}
export async function parseQrCodeBody(req, res) {
  return {
    title: req.body.title,
    productId: req.body.productId,
    variantId: req.body.variantId,
    handle: req.body.handle,
    discountId: req.body.discountId,
    discountCode: req.body.discountCode,
    destination: req.body.destination,
  };
}

export async function formatQrCodeResponse(req, res, rawCodeData) {
  const ids = [];

  /* Get every product, variant and discountID that was queried from the database */
  rawCodeData.forEach(({ productId, discountId, variantId }) => {
    ids.push(productId);
    ids.push(variantId);

    if (discountId) {
      ids.push(discountId);
    }
  });

  /* Instantiate a new GraphQL client to query the Shopify GraphQL Admin API */
  const session = await Shopify.Utils.loadCurrentSession(req, res, false);
  const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);

  /* Query the Shopify GraphQL Admin API */
  const adminData = await client.query({
    data: {
      query: QR_CODE_ADMIN_QUERY,

      /* The IDs that are pulled from the app's database are used to query product, variant and discount information */
      variables: { ids },
    },
  });

  // console.log("AdminData", adminData.body.data.nodes);

  /*
    Replace the product, discount and variant IDs with the data fetched using the Shopify GraphQL Admin API.
  */
  const formattedData = rawCodeData.map((qrCode) => {
    //console.log("QRCode",qrCode)

    const product = adminData.body.data.nodes.find(
      (node) => qrCode.productId === node?.id
    ) || {
      title: "Deleted product",
    };

    //console.log("Product",product)

    // const discountDeleted =
    //   qrCode.discountId &&
    //   !adminData.body.data.nodes.find((node) => qrCode.discountId === node?.id);
     
    // console.log("", discountDeleted);
    // /*
    //   A user might create a QR code with a discount code and then later delete that discount code.
    //   For optimal UX it's important to handle that edge case.
    //   Use mock data so that the frontend knows how to interpret this QR Code.
    // */
    // if (discountDeleted) {
    //   qrcode_model.findByIdAndUpdated(qrCode.id, {
    //     ...qrCode,
    //     discountId: "",
    //     discountCode: "",
    //   });
    // }
    
    /*
      Merge the data from the app's database with the data queried from the Shopify GraphQL Admin API
    */
      // console.log("qrcode",qrCode);
      // console.log("product",product);
    
    const formattedQRCode = {
      ...qrCode,
      product,
      // discountCode: discountDeleted ? "" : qrCode.discountCode,
    };
    // console.log("formattedQRcode", formattedQRCode);
    const formattedQRCode1= {
      ...formattedQRCode._doc,
      product
    }
    //console.log("formattedQRcode11", formattedQRCode1);
    /* Since product.id already exists, productId isn't required */
    delete formattedQRCode1.productId;

    //console.log("formattedQRcode666666", formattedQRCode);

    return formattedQRCode1;
  });
 //console.log("formattedData&&&&&&&&&&", formattedData);

  return formattedData;
}