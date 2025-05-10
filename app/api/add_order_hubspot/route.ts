import { NextResponse } from "next/server";

interface OrderRequestBody {
  email?: string;
  solana_wallet_address?: string;
  attendance_value: string;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const contactId = url.searchParams.get('contactId');
    const email = url.searchParams.get('email');
    const solana_wallet_address = url.searchParams.get('solana_wallet_address');

    // Get HubSpot API key from environment variables
    const hubspotApiKey = process.env.HUBSPOT_API_KEY;
    
    if (!hubspotApiKey) {
      console.error("HUBSPOT_API_KEY is not set in environment variables");
      return NextResponse.json(
        { success: false, error: "API configuration error" },
        { status: 500 }
      );
    }

    // If contactId is provided, get contact by ID
    if (contactId) {
      const contact = await getContactById(hubspotApiKey, contactId);
      
      if (!contact) {
        return NextResponse.json(
          { success: false, error: "Contact not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        contact 
      });
    } 
    // If email or wallet address is provided, find contact
    else if (email || solana_wallet_address) {
      const contact = await findContact(hubspotApiKey, email || undefined, solana_wallet_address || undefined);
      
      if (!contact) {
        return NextResponse.json(
          { success: false, error: "Contact not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        contact 
      });
    }
    // If no params provided, return error
    else {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: contactId, email, or solana_wallet_address" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: OrderRequestBody = await req.json();

    if (
      (!body.email && !body.solana_wallet_address) ||
      !body.attendance_value
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: email or solana_wallet_address and buildstation_attendance_spring_2025 is required",
        },
        { status: 400 }
      );
    }

    const { email, solana_wallet_address} = body;
    let { attendance_value } = body;
    attendance_value = ";" + attendance_value;

    const hubspotApiKey = process.env.HUBSPOT_API_KEY;

    if (!hubspotApiKey) {
      console.error("HUBSPOT_API_KEY is not set in environment variables");
      return NextResponse.json(
        { success: false, error: "API configuration error" },
        { status: 500 }
      );
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
        return NextResponse.json(
          { success: false, error: "Failed to update contact in HubSpot" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        contactId: id,
        message: "Contact successfully updated in HubSpot CRM",
      });
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
      return NextResponse.json(
        { success: false, error: "Failed to create contact in HubSpot" },
        { status: 500 }
      );
    }

    const id = createData.id;

    return NextResponse.json(
      {
        success: true,
        contactId: id,
        message: "Contact successfully created in HubSpot",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding contact to HubSpot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add contact to HubSpot" },
      { status: 500 }
    );
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

// Function to get contact by ID
async function getContactById(apiKey: string, contactId: string): Promise<any | null> {
  try {
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email,solana_wallet_address,buildstation_attendance__spring_2025_,firstname,lastname,hs_object_id,createdate`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch contact:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching contact by ID:", error);
    return null;
  }
}
