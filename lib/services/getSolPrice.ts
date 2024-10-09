
export async function getSolPrice(): Promise<number | null> {
  try {
    const response = await fetch("https://api.mobula.io/api/1/market/data?asset=solana", {
      method: "GET",
      headers: {
        Authorization: "a8666314-2e02-4380-9072-c56da3a54b94",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch SOL price");
    }

    const data = await response.json();

    if (data && data.data && data.data.price) {
      return Number(data.data.price.toFixed(2));
    } else {
      throw new Error("Invalid response structure");
    }
  } catch (error) {
    console.error("Error fetching SOL price:", error);
    return null;
  }
}
