export const createProduct = async (nftName: string, price: number) => {
  const res = await fetch("/api/add_product", {
    method: "POST",
    body: JSON.stringify({ nftName, price }),
  });
  const data = await res.json();
  console.log(data, "data");
  return data.product.default_price;
};
