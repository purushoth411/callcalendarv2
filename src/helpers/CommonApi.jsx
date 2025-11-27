import API_URL from "../utils/constants";

export const fetchAllConsultants = async () => {
  try {
    const response = await fetch(`${API_URL}/api/helpers/getAllActiveConsultants`);
    if (!response.ok) throw new Error("Failed to fetch consultants");
    return await response.json();
  } catch (error) {
    console.error("Error fetching consultants:", error);
    return [];
  }
};

export const fetchAllSubjectAreas = async () => {
  try {
    const response = await fetch(`${API_URL}/api/helpers/getAllSubjectAreas`);
    if (!response.ok) throw new Error("Failed to fetch subject areas");
    return await response.json();
  } catch (error) {
    console.error("Error fetching subject areas:", error);
    return [];
  }
};

export const fetchPlanDetails = async () => {
  try {
    const response = await fetch(`${API_URL}/api/helpers/getPlanDetails`);
    if (!response.ok) throw new Error("Failed to fetch plan details");
    return await response.json();
  } catch (error) {
    console.error("Error fetching plan details:", error);
    return [];
  }
};

export const fetchFollowerData = async (filterData) => {
  try {
    const response = await fetch(`${API_URL}/api/helpers/fetchFollowerData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filterData)
    });

    const result = await response.json();

    if (result.status) {
      console.log("Data fetched:", result.data);
      return result; 
    } else {
      console.warn("Failed to fetch follower data:", result.message);
      return result;
    }

  } catch (error) {
    console.error("API call error:", error);
    return {
      status: false,
      message: "Network or server error",
      data: null
    };
  }
};
