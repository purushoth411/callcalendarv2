// Shared criteria checker
// Shared criteria checker
const meetsAllCriteria = (
  data,
  {
    isBookingList,
    subjectArea = "",
    callRelatedTo = "",
    consultantType = "",
    priceDiscoutUsernames = []
  }
) => {
  console.log("ConsultantType:", consultantType);

  let statusMatch = true;

  if (consultantType) {
    // If consultantType is given, match exactly (case-insensitive)
    statusMatch =
      consultantType.toUpperCase() === data.status?.toUpperCase();
  } else {
    // Default rule if consultantType not given: must be ACTIVE
    statusMatch = data.status?.toUpperCase() === "ACTIVE";
  }

  const meetsAttendance =
    !isBookingList || data.attendance?.toUpperCase() === "PRESENT";

  let meetsExtraCriteria = true;

  // Subject area filtering
  if (callRelatedTo === "subject_area_related") {
    meetsExtraCriteria = Array.isArray(data.subject_area)
      ? data.subject_area.includes(subjectArea)
      : data.subject_area === subjectArea;
  }

  // Price & discount filtering
  else if (callRelatedTo === "price_and_discount_related") {
    meetsExtraCriteria = priceDiscoutUsernames.includes(data.fld_username);
  }

  return statusMatch && meetsAttendance && meetsExtraCriteria;
};


// Helper to update a list based on criteria
const updateList = (prev, data, criteriaMet) => {
  if (!criteriaMet) {
    console.log("Not Adding (Filtered Out)");
    return prev.filter((c) => c.id != data.id);
  }

  const exists = prev.some((c) => c.id == data.id);
  if (!exists) {
    console.log("Adding");
    return [
      ...prev,
      {
        id: data.id,
        fld_email: data.fld_email,
        fld_name: data.fld_name,
        fld_permission: data.fld_permission,
        fld_username: data.fld_username,
        attendance: data.attendance,
        status: data.status,
        subject_area: data.subject_area,
      },
    ];
  }

  return prev.map((c) =>
    c.id == data.id
      ? {
          ...c,
          attendance: data.attendance,
          status: data.status,
          subject_area: data.subject_area,
        }
      : c
  );
};

// Attendance Listener
export const createAttendanceListener = (
  setAllUsers,
  otherSetters,
  priceDiscoutUsernames
) => {
  return (data) => {
    console.log("Socket Called (Attendance)", data);

    // Update AllUsers attendance
    if (setAllUsers) {
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id == data.id ? { ...user, attendance: data.attendance } : user
        )
      );
    }

    // Process other setters
    otherSetters.forEach((params) => {
      if (!params.setFn) return;
      params.setFn((prev) =>
        updateList(
          prev,
          data,
          meetsAllCriteria(data, { ...params, priceDiscoutUsernames })
        )
      );
    });
  };
};

// Status Listener
export const createUserStatusListener = (
  setAllUsers,
  otherSetters,
  priceDiscoutUsernames
) => {
  return (data) => {
    console.log("Socket Called (Status)", data);

    // Update AllUsers status
    if (setAllUsers) {
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id == data.id ? { ...user, status: data.status } : user
        )
      );
    }

    // Process other setters
    otherSetters.forEach((params) => {
      if (!params.setFn) return;
      params.setFn((prev) =>
        updateList(
          prev,
          data,
          meetsAllCriteria(data, { ...params, priceDiscoutUsernames })
        )
      );
    });
  };
};
