/* MAIN */

const handler = async (productInfo) => {};

const pData = {
  id: 6677649588409,
  title: "Wasser und Brot",
  body_html: "",
  vendor: "D2C Brand",
  product_type: "",
  created_at: "2021-04-26T04:36:58+02:00",
  handle: "wasser-und-brot",
  updated_at: "2021-04-26T04:36:59+02:00",
  published_at: null,
  template_suffix: "",
  status: "draft",
  published_scope: "web",
  tags: "",
  admin_graphql_api_id: "gid://shopify/Product/6677649588409",
  variants: [
    {
      id: 39881307127993,
      product_id: 6677649588409,
      title: "Default Title",
      price: "5.00",
      sku: "abcd",
      position: 1,
      inventory_policy: "continue",
      compare_at_price: null,
      fulfillment_service: "manual",
      inventory_management: "shopify",
      option1: "Default Title",
      option2: null,
      option3: null,
      created_at: "2021-04-26T04:36:58+02:00",
      updated_at: "2021-04-26T04:36:58+02:00",
      taxable: true,
      barcode: "",
      grams: 0,
      image_id: null,
      weight: 0,
      weight_unit: "kg",
      inventory_item_id: 41975501127865,
      inventory_quantity: 0,
      old_inventory_quantity: 0,
      requires_shipping: true,
      admin_graphql_api_id: "gid://shopify/ProductVariant/39881307127993",
    },
  ],
  options: [
    {
      id: 8599830397113,
      product_id: 6677649588409,
      name: "Title",
      position: 1,
      values: ["Default Title"],
    },
  ],
  images: [],
  image: null,
};

handler(pData).then((res) => console.log(res));
