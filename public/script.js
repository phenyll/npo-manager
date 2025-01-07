const membersTable = document.getElementById("membersTable");
const paymentsTable = document.getElementById("paymentsTable");

// API URLs
const MEMBERS_API = "/members";
const PAYMENTS_API = "/payments";
const IMPORT_API = "/import-members";

// Mitglieder laden
function loadMembers() {
    fetch("/members")
      .then((response) => response.json())
      .then((data) => {
        membersTable.innerHTML = data.members
          .map(
            (member) => `
            <tr>
              <td>${member.id}</td>
              <td>${member.firstName}</td>
              <td>${member.lastName}</td>
              <td>${member.city}</td>
              <td>${member.childName || "-"}</td>
              <td>${member.enrollmentYear || "-"}</td>
              <td>${member.joinDate || "-"}</td>
              <td>${member.expectedExitDate || "-"}</td>
              <td>${member.actualExit || "nein"}</td>
              <td>
                <button class="btn btn-info btn-sm" onclick="viewMemberDetails(${member.id})">Bearbeiten</button>
                <button class="btn btn-danger btn-sm" onclick="deleteMember(${member.id})">Löschen</button>
              </td>
            </tr>`
          )
          .join("");
      });
  }
  
  //Beiträge laden
  async function loadPayments() {
    const response = await fetch("/payments");
    const data = await response.json();
  
    paymentsTable.innerHTML = data.payments
      .map(
        (payment) => `
        <tr>
          <td>${payment.memberId}</td>
          <td>${payment.year}</td>
          <td>${payment.amount} €</td>
          <td>${payment.status}</td>
          <td>${payment.paymentMethod || "Bank"}</td>
          <td>
            <button class="btn btn-info btn-sm" onclick="viewPaymentDetails(${payment.id})">Bearbeiten</button>
            ${
              payment.status === "offen"
                ? `<button class="btn btn-success btn-sm" onclick="markAsPaid(${payment.id})">Bezahlt</button>`
                : `<span class="text-success">Bezahlt am ${payment.paymentDate || "unbekannt"}</span>`
            }
          </td>
        </tr>`
      )
      .join("");
  }
  
  

// Neues Mitglied hinzufügen
document.getElementById("addMemberButton").addEventListener("click", async () => {
  const firstName = prompt("Vorname:");
  const lastName = prompt("Nachname:");
  const city = prompt("Ort:");
  const email = prompt("Email:");
  const phone = prompt("Telefon:");
  const newMember = { firstName, lastName, city, email, phone };
  await fetch(MEMBERS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newMember),
  });
  loadMembers();
});

// Neuer Beitrag hinzufügen
document.getElementById("addPaymentButton").addEventListener("click", async () => {
    const memberId = parseInt(prompt("Mitglied Nr:"));
    const year = parseInt(prompt("Jahr:"));
    const amount = parseFloat(prompt("Betrag:"));
    const status = prompt("Status (offen/gezahlt):");
    const paymentMethod = prompt("Zahlweg (Bank/Bar):", "Bank");
  
    const newPayment = {
      memberId,
      year,
      amount,
      status,
      paymentMethod: paymentMethod || "Bank",
    };
  
    try {
      const response = await fetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayment),
      });
  
      if (response.ok) {
        alert("Beitrag erfolgreich hinzugefügt!");
        loadPayments(); // Beiträge neu laden
      } else {
        alert("Fehler beim Hinzufügen des Beitrags.");
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler beim Hinzufügen des Beitrags.");
    }
  });
  

document.getElementById("memberForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = e.target.dataset.memberId;
  
    const updatedMember = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      city: document.getElementById("city").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      childName: document.getElementById("childName").value,
      enrollmentYear: document.getElementById("enrollmentYear").value,
      joinDate: document.getElementById("joinDate").value,
      expectedExitDate: document.getElementById("expectedExitDate").value,
      actualExit: document.getElementById("actualExit").value,
    };
  
    fetch(`/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMember),
    })
      .then((response) => {
        if (response.ok) {
          alert("Mitglied erfolgreich aktualisiert!");
          loadMembers(); // Mitgliederliste neu laden
          document.getElementById("memberDetails").classList.add("d-none");
          document.getElementById("members").classList.remove("d-none");
        } else {
          alert("Fehler beim Speichern der Änderungen.");
        }
      })
      .catch((error) => console.error("Fehler:", error));
  });  

  document.getElementById("cancelEdit").addEventListener("click", () => {
    document.getElementById("memberDetails").classList.add("d-none");
    document.getElementById("members").classList.remove("d-none");
  });  

  document.getElementById("bulkPaymentsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const year = document.getElementById("bulkYear").value;
    const amount = document.getElementById("bulkAmount").value;
  
    try {
      const response = await fetch("/payments/create-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, amount }),
      });
  
      if (response.ok) {
        alert("Beitragsforderungen erfolgreich erstellt!");
        loadPayments();
      } else {
        const message = await response.text();
        alert(`Fehler: ${message}`);
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler beim Erstellen der Forderungen.");
    }
  });
  
  function viewPaymentDetails(id) {
    fetch(`/payments/${id}`)
      .then((response) => response.json())
      .then((data) => {
        document.getElementById("paymentYear").value = data.year;
        document.getElementById("paymentAmount").value = data.amount;
        document.getElementById("paymentStatus").value = data.status;
        document.getElementById("paymentMethod").value = data.paymentMethod || "Bank";
  
        // Detailansicht anzeigen
        document.getElementById("paymentDetails").classList.remove("d-none");
        document.getElementById("payments").classList.add("d-none");
  
        // Speichern der ID für spätere Updates
        document.getElementById("paymentForm").dataset.paymentId = id;
      });
  }
  
  
  document.getElementById("paymentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = e.target.dataset.paymentId;
  
    const updatedPayment = {
      year: document.getElementById("paymentYear").value,
      amount: document.getElementById("paymentAmount").value,
      status: document.getElementById("paymentStatus").value,
      paymentMethod: document.getElementById("paymentMethod").value,
    };
  
    fetch(`/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPayment),
    })
      .then((response) => {
        if (response.ok) {
          alert("Beitrag erfolgreich aktualisiert!");
          loadPayments(); // Zahlungen neu laden
          document.getElementById("paymentDetails").classList.add("d-none");
          document.getElementById("payments").classList.remove("d-none");
        } else {
          alert("Fehler beim Speichern der Änderungen.");
        }
      })
      .catch((error) => console.error("Fehler:", error));
  });
  
  document.getElementById("cancelPaymentEdit").addEventListener("click", () => {
    document.getElementById("paymentDetails").classList.add("d-none");
    document.getElementById("payments").classList.remove("d-none");
  });  

  function markAsPaid(id) {
    const today = new Date().toISOString().split("T")[0];
    const paymentDate = prompt("Bezahlt am (YYYY-MM-DD):", today);
  
    if (paymentDate) {
      fetch(`/payments/${id}/pay`, {
        method: "PUT", // Methode muss PUT sein
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentDate }),
      })
        .then((response) => {
          if (response.ok) {
            alert("Beitrag als bezahlt markiert!");
            loadPayments();
          } else {
            response.text().then((text) => alert(`Fehler: ${text}`));
          }
        })
        .catch((error) => console.error("Fehler:", error));
    }
  }  
  

// Mitglied bearbeiten
function editMember(id) {
  alert(`Bearbeiten von Mitglied ${id} wird in Zukunft unterstützt.`);
}

// Beitrag bearbeiten
function editPayment(memberId, year) {
  alert(`Bearbeiten von Beitrag für Mitglied ${memberId}, Jahr ${year} wird in Zukunft unterstützt.`);
}

// Mitglied löschen
function deleteMember(id) {
  alert(`Löschen von Mitglied ${id} wird in Zukunft unterstützt.`);
}

// Beitrag löschen
function deletePayment(memberId, year) {
  alert(`Löschen von Beitrag für Mitglied ${memberId}, Jahr ${year} wird in Zukunft unterstützt.`);
}

// Excel-Datei importieren
document.getElementById("importForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch(IMPORT_API, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      alert("Mitglieder erfolgreich importiert!");
      loadMembers(); // Aktualisiert die Mitgliederliste
    } else {
      alert("Fehler beim Importieren der Datei.");
    }
  } catch (error) {
    console.error("Fehler:", error);
    alert("Fehler beim Importieren der Datei.");
  }
});

function viewMemberDetails(id) {
    fetch(`/members/${id}`)
      .then((response) => response.json())
      .then((data) => {
        // Formularfelder mit Mitgliedsdaten füllen
        document.getElementById("firstName").value = data.firstName;
        document.getElementById("lastName").value = data.lastName;
        document.getElementById("city").value = data.city;
        document.getElementById("email").value = data.email;
        document.getElementById("phone").value = data.phone;
        document.getElementById("childName").value = data.childName || "";
        document.getElementById("enrollmentYear").value = data.enrollmentYear || "";
        document.getElementById("joinDate").value = data.joinDate || "";
        document.getElementById("expectedExitDate").value = data.expectedExitDate || "";
        document.getElementById("actualExit").value = data.actualExit || "nein";
  
        // Detailansicht anzeigen
        document.getElementById("memberDetails").classList.remove("d-none");
        document.getElementById("members").classList.add("d-none");
  
        // Speichern der ID für spätere Updates
        document.getElementById("memberForm").dataset.memberId = id;
      });
  }

document.getElementById("exportOpenPaymentsButton").addEventListener("click", () => {
    fetch("/export-open-payments")
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "offene_beitraege.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((error) => console.error("Fehler beim Exportieren der offenen Beiträge:", error));
  });  

// Initiales Laden der Daten
loadMembers();
loadPayments();
