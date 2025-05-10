interface OrderRequestBody {
    email?: string;
    solana_wallet_address?: string;
    attendance_value: string;
}


export async function addOrder({
    email,
    solana_wallet_address,
    attendance_value
}: OrderRequestBody) {
    try {
        if (
            (!email && !solana_wallet_address) ||
            !attendance_value
        ) {
            throw new Error("Missing required fields: email or solana_wallet_address and buildstation_attendance_spring_2025 is required");
        }

        attendance_value = ";" + attendance_value;

        const hubspotApiKey = process.env.HUBSPOT_API_KEY;

        if (!hubspotApiKey) {
            console.error("HUBSPOT_API_KEY is not set in environment variables");
            throw new Error("API configuration error");
        }

        const contact = await findContact(hubspotApiKey, email, solana_wallet_address);

        if (contact) {
            const id = contact.id;
            const exisitingAttendance = contact.properties.buildstation_attendance__spring_2025_;

            let newAttendance = exisitingAttendance ? exisitingAttendance + attendance_value : attendance_value;

            const updateResponse = await fetch(
                `https://api.hubapi.com/crm/v3/objects/contacts/${id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${hubspotApiKey}`,
                    },
                    body: JSON.stringify({
                        properties: {
                            buildstation_attendance__spring_2025_: newAttendance,
                        },
                    }),
                }
            );

            if (!updateResponse.ok) {
                const updateData = await updateResponse.json();
                console.error("Failed to update contact:", updateData);
                throw new Error("Failed to update contact in HubSpot");
            }

            return {
                success: true,
                contactId: id,
                message: "Contact successfully updated in HubSpot CRM",
            };
        }

        const createResponse = await fetch(
            "https://api.hubapi.com/crm/v3/objects/contacts",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${hubspotApiKey}`,
                },
                body: JSON.stringify({
                    properties: {
                        email: email || "",
                        solana_wallet_address: solana_wallet_address || "",
                        buildstation_attendance__spring_2025_: attendance_value,
                    },
                }),
            }
        );

        const createData = await createResponse.json();

        if (!createResponse.ok) {
            console.error("Failed to create contact:", createData);
            throw new Error("Failed to create contact in HubSpot");
        }

        const id = createData.id;

        return {
            success: true,
            contactId: id,
            message: "Contact successfully created in HubSpot",
        };
    } catch (error) {
        console.error("Error adding contact to HubSpot:", error);
        throw new Error("Failed to add contact to HubSpot");
    }
}

async function findContact(
    apiKey: string,
    email?: string,
    solanaWalletAddress?: string
): Promise<any | null> {
    try {
        const filters = [];

        if (email) {
            filters.push({
                propertyName: "email",
                operator: "EQ",
                value: email,
            });
        }

        if (solanaWalletAddress) {
            filters.push({
                propertyName: "solana_wallet_address",
                operator: "EQ",
                value: solanaWalletAddress,
            });
        }

        const filterGroups = [];

        if (email && solanaWalletAddress) {
            filterGroups.push(
                { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
                { filters: [{ propertyName: "solana_wallet_address", operator: "EQ", value: solanaWalletAddress }] }
            );
        } else {
            filterGroups.push({ filters });
        }

        const searchResponse = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/search`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    filterGroups,
                    properties: ["email", "solana_wallet_address", "buildstation_attendance__spring_2025_", "firstname", "lastname"]
                }),
            }
        );

        const searchData = await searchResponse.json();
        console.dir(searchData, { depth: null });

        if (
            searchData.total > 0 &&
            searchData.results &&
            searchData.results.length > 0
        ) {
            return searchData.results[0];
        }

        return null;
    } catch (error) {
        console.error("Error searching for contact:", error);
        return null;
    }
}