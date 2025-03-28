const membersTable = document.getElementById("membersTable");
const paymentsTable = document.getElementById("paymentsTable");
const searchInput = document.getElementById("searchInput");
const paymentSearchInput = document.getElementById("paymentSearchInput");

paymentSearchInput.addEventListener("input", function() {
  const filter = this.value.toLowerCase();
  const rows = document.querySelectorAll('#paymentsTable tr');
  rows.forEach(row => {
    const memberIdCell = row.querySelector('td:first-child');
    const matches = memberIdCell && filter.split(' ').every(word => memberIdCell.textContent.toLowerCase().includes(word));
    row.style.display = filter?(matches ? '' : 'none'):'';
  });
});

window.setTimeout(setUserInfo, 500);

const debouncedLoadMembers = debounce(loadMembers, 500);
searchInput.addEventListener("input", debouncedLoadMembers);

// API URLs
const MEMBERS_API = "/members";
const PAYMENTS_API = "/payments";
const IMPORT_API = "/import-members";
const USERS_API = "/users";

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function setUserInfo(){
    fetch("/users/me")
        .then((response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                window.location.href = "/login";
                return;
            }
        })
        .then((data) => {
            document.getElementById("loggedInUser").innerText = data.username;
        });
}

let organizationDetails = null;

function loadOrganizationDetails() {
    fetch('/organization/details')
        .then(response => {
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Vereinsdaten');
            }
            return response.json();
        })
        .then(data => {
            organizationDetails = data;
            console.log('Vereinsdaten geladen');
        })
        .catch(error => {
            console.error('Fehler:', error);
        });
}

// Mitglieder laden
function loadMembers() {
    fetch("/members")
      .then((response) => {
          if (response.status === 401) {
              window.location.href = "/login";
              return;
          }
          return response.json();
      })
      .then((data) => {
        window.members = data.members;
        const searchQuery = searchInput.value.toLowerCase();
        const filteredMembers = data.members.filter((member) => {
          return (
            (member.firstName && member.firstName.toLowerCase().includes(searchQuery)) ||
            (member.lastName && member.lastName.toLowerCase().includes(searchQuery)) ||
            (member.city && member.city.toLowerCase().includes(searchQuery)) ||
            (member.childName && member.childName.toLowerCase().includes(searchQuery)) ||
            (member.enrollmentYear && member.enrollmentYear.toString().includes(searchQuery)) ||
            (member.joinDate && member.joinDate.toLowerCase().includes(searchQuery)) ||
            (member.expectedExitDate && member.expectedExitDate.toLowerCase().includes(searchQuery)) ||
            (member.autoExit && member.autoExit.toLowerCase().includes(searchQuery)) ||
            (member.actualExit && member.actualExit.toLowerCase().includes(searchQuery))
          );
        });
        membersTable.innerHTML = filteredMembers
          .map(
            (member) => `
            <tr style="background-color: ${member.actualExit ? "#f8d7da" : ""}">
              <td>${member.id}</td>
              <td>${member.firstName}</td>
              <td>${member.lastName}</td>
              <td>${member.city}</td>
              <td>${member.childName || "-"}</td>
              <td>${member.enrollmentYear || "-"}</td>
              <td>${formatDate(member.joinDate) || "-"}</td>
              <td>${formatDate(member.expectedExitDate) || "-"}</td>
              <td>${formatDate(member.actualExit) || "-"}</td>
              <td>
                <div style="white-space: nowrap">
                    <button class="btn btn-info btn-sm" onclick="viewMemberDetails(${member.id})" title="Mitgliedsdaten bearbeiten">📝</button>
                    <button class="btn btn-secondary btn-sm" onclick="viewMemberPayments(${member.id})" title="Zahlungen vom Mitglied verwalten">💶</button>
                    ${ member.actualExit?"🏁":`
                        <button class="btn btn-warning btn-sm" onclick="recordMemberExit(${member.id})" title="Austritt erfassen">🚪</button>
                        ` }
                </div>
              </td>
            </tr>`
          )
          .join("");
      });
  }

  function viewMemberPayments(memberId) {
    const paymentsTab = new bootstrap.Tab(document.querySelector('#payments-tab'));
    paymentsTab.show();
    paymentSearchInput.value = `${memberId} ${window.members.find(m => m.id === memberId).firstName} ${window.members.find(m => m.id === memberId).lastName}`;
    const event = new Event('input');
    paymentSearchInput.dispatchEvent(event);
  }
  
  //Beiträge laden
  function loadPayments(preserveFilter = true) {
      const currentFilter = preserveFilter ? paymentSearchInput.value : '';

      return fetch("/payments")
          .then((response) => {
              if (response.status === 401) {
                  window.location.href = "/login";
                  return;
              }
              return response.json();
          })
          .then((data) => {
              window.payments = data.payments;

              return fetch("/members")
                  .then(response => response.json())
                  .then(memberData => {
                      const members = memberData.members;
                      const memberfinder = (id) => {
                          const m = members.find((m) => m.id === id);
                          return function memberFormatter(fields) {
                              return fields.map((field) => m[field] || "-").join(" ");
                          }
                      }

                      paymentsTable.innerHTML = data.payments
                          .map(
                              (payment) => {
                                  const memberFormatter = memberfinder(payment.memberId)

                                  // Reminder information
                                  let reminderInfo = '';
                                  if (payment.reminder_count > 0) {
                                      reminderInfo = `<span class="badge bg-warning text-dark">Gemahnt: ${formatDate(payment.last_reminder_date) || "unbekannt"} (${payment.reminder_count}x)</span>`;
                                  }

                                  return `
              <tr>
                <td>
                  <span class="pill">${payment.memberId}</span>
                  ${memberFormatter(["firstName", "lastName"])}
                </td>
                <td>${payment.year}</td>
                <td>${payment.amount} €</td>
                <td>${payment.status} ${reminderInfo}</td>
                <td>${payment.paymentMethod || "-"}</td>
                <td>
                  <button class="btn btn-info btn-sm" onclick="viewPaymentDetails(${payment.id})" title="Zahlung einsehen oder ändern"> 📝 </button>
                  ${
                                      payment.status === "offen"
                                          ? `<button class="btn btn-success btn-sm" onclick="markAsPaid(${payment.id})" title="Beitrag als bezahlt markieren"> ✅ </button>
                         <button class="btn btn-danger btn-sm" onclick="deletePayment(${payment.id})" title="Beitrag löschen"> 🚮 </button>
                         <button class="btn btn-warning btn-sm" onclick="addReminder(${payment.id})" title="Mahnung erfassen"> 📨 </button>`
                                          : `<span class="text-success">Bezahlt am ${formatDate(payment.paymentDate) || "unbekannt"}</span>`
                                  }
                  ${
                                      payment.status === "offen" && memberFormatter(["email"])
                                          ? `<a href="mailto:${
                                              memberFormatter(["email"])
                                          }?subject=${
                                              encodeURIComponent(`Erinnerung an die Zahlung des jährlichen Mitgliedsbeitrags für ${payment.year}`)
                                          }" class="btn btn-info btn-sm" title="Erinnerungsmail verfassen + Zwischenablage mit Mailvorlage füllen" onclick="setClipboardErinnerungsmailContent('${memberFormatter(["childName"])}', '${payment.year}')"> 🕵🏻‍♂️ </a>`
                                          : ""
                                  }
                </td>
              </tr>`
                              }
                          )
                          .join("");

                      // Re-apply filter if we're preserving it
                      if (currentFilter) {
                          paymentSearchInput.value = currentFilter;
                          const event = new Event('input');
                          paymentSearchInput.dispatchEvent(event);
                      }

                      return data;
                  });
          });
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
async function addNewPayment(ref){
    const memberId = parseInt(ref.querySelector("#newPayment-memberNumber").value);
    const year = parseInt(ref.querySelector("#newPayment-paymentYear").value);
    const amount = parseFloat(ref.querySelector("#newPayment-paymentAmount").value);
    const status = ref.querySelector("#newPayment-paymentStatus").value;
    const paymentMethod = ref.querySelector("#newPayment-paymentMethod").value;
    let paymentDate = ref.querySelector("#newPayment-paymentDate").value;

    paymentDate = paymentDate ? formatDateForServer(paymentDate) : null;

    const newPayment = {
        memberId,
        year,
        amount,
        status,
        paymentMethod: paymentMethod || "Bank",
        paymentDate
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
        const errorText = await response.text();
        alert(`Fehler: ${errorText}`);
      }
    } catch (error) {
      console.error("Fehler:", error);
      alert("Fehler beim Hinzufügen des Beitrags.");
    }
}

function setClipboardErinnerungsmailContent(nameDesKindes, jahr){
    const mailContent = `<p>Liebes Mitglied des Schulfördervereins,</p>

<p>wir hoffen, dass es Ihnen gut geht und Sie das vergangene Jahr gut überstanden haben. Wir möchten Sie daran erinnern, dass der <strong>jährliche Mitgliedsbeitrag in Höhe von nur 12 Euro für das Jahr ${jahr} noch offen</strong> ist. Mit Ihrem Beitrag unterstützen Sie unsere Schule und tragen dazu bei, dass wir weiterhin wertvolle Projekte und Aktivitäten für unsere Schülerinnen und Schüler anbieten können.</p>

<p>Um Ihnen die Zahlung so einfach wie möglich zu machen, haben wir folgende Optionen für Sie vorbereitet:</p>

<ol>
  <li><strong>Überweisung:</strong> Bitte überweisen Sie den Betrag von 12 Euro auf folgendes Konto:<br>
  Kontoinhaber: ${organizationDetails?.name}<br>
  IBAN: ${organizationDetails?.bankDetails.iban}<br>
  BIC: ${organizationDetails?.bankDetails.bic}<br>
  Verwendungszweck: Mitgliedsbeitrag ${nameDesKindes} ${jahr}</li>

  <li><strong>Dauerauftrag:</strong> Richten Sie einen Dauerauftrag ein, um den Beitrag jährlich automatisch zu überweisen. So müssen Sie sich keine Gedanken mehr über die Zahlung machen.</li>

  <li><strong>Barzahlung:</strong> Sie können den Betrag auch bar im Sekretariat der Schule entrichten. Bitte geben Sie den Betrag in einem Umschlag mit Ihrem Namen und dem Verwendungszweck "Mitgliedsbeitrag ${jahr}" ab.</li>
</ol>

<p>Wir danken Ihnen herzlich für Ihre Unterstützung und Ihr Engagement. Bei Fragen oder Anliegen stehen wir Ihnen gerne zur Verfügung.</p>

<p>Mit freundlichen Grüßen,</p>

<p>${organizationDetails?.nameKassenwart}<br>
Kassenwart<br>
${organizationDetails?.name}<br>
${organizationDetails?.address}</p>`;
    // Für HTML-Text in die Zwischenablage
    const clipboardItem = new ClipboardItem({
        'text/plain': new Blob([mailContent.replace(/<[^>]*>/g, '')], {type: 'text/plain'}),
        'text/html': new Blob([mailContent], {type: 'text/html'})
    });

    navigator.clipboard.write([clipboardItem]).then(() => {
        console.log('HTML-formatierter Text in die Zwischenablage kopiert');
    }).catch(err => {
        console.error('Fehler beim Kopieren in die Zwischenablage:', err);
        // Fallback zur alten Methode
        navigator.clipboard.writeText(mailContent.replace(/<[^>]*>/g, '')).then(() => {
            console.log('Einfacher Text in die Zwischenablage kopiert (Fallback)');
        }).catch(err => {
            console.error('Fehler beim Kopieren in die Zwischenablage:', err);
            alert("Fehler beim Kopieren in die Zwischenablage. Bitte versuchen Sie es erneut.");
        });
    });
}

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
      autoExit: document.getElementById("autoExit").value,
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
      paymentDate: document.getElementById("paymentDate").value,
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
    const today = new Date().toISOString().split("T")[0].split("-").reverse().join(".");
    const paymentDate = prompt("Bezahlt am:", today);
    const paymentMethod = prompt("Zahlweg (Bank/Bar):", "Bank");
    const amount = parseFloat(prompt("Betrag:", window.payments.find(p => p.id === id).amount));
  
    if (paymentDate) {
      fetch(`/payments/${id}/pay`, {
        method: "PUT", // Methode muss PUT sein
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentDate, paymentMethod, amount}),
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
function deletePayment(id) {
    if (confirm("Möchten Sie diesen Beitrag wirklich löschen?")) {
        fetch(`/payments/${id}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (response.ok) {
                    alert("Beitrag erfolgreich gelöscht!");
                    loadPayments(); // Zahlungen neu laden
                } else {
                    response.text().then((text) => alert(`Fehler: ${text}`));
                }
            })
            .catch((error) => console.error("Fehler:", error));
    }
}

function recordMemberExit(id) {
    const member = window.members.find(m => m.id === id);
    if (!member) return;

    const defaultDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const exitDate = prompt(`Austrittsdatum für ${member.firstName} ${member.lastName}:`, defaultDate);

    if (exitDate) {
        fetch(`/members/${id}/exit`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exitDate }),
        })
            .then((response) => {
                if (response.ok) {
                    alert("Austritt erfolgreich erfasst!");
                    loadMembers(); // Refresh the members list
                } else {
                    response.text().then((text) => alert(`Fehler: ${text}`));
                }
            })
            .catch((error) => console.error("Fehler:", error));
    }
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
        document.getElementById("autoExit").value = data.autoExit || "";
        document.getElementById("actualExit").value = data.actualExit || "";
  
        // Detailansicht anzeigen
        document.getElementById("memberDetails").classList.remove("d-none");
        document.getElementById("members").classList.add("d-none");
  
        // Speichern der ID für spätere Updates
        document.getElementById("memberForm").dataset.memberId = id;
      });
  }

  function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date)) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

function formatDateForServer(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.getElementById("exportOpenPaymentsButton").addEventListener("click", () => {
    fetch("/payments/export-open-payments")
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

function addReminder(paymentId) {
    // Get payment details
    const payment = window.payments.find(p => p.id === paymentId);
    if (!payment) {
        alert("Zahlung nicht gefunden");
        return;
    }

    // Pre-populate reminder fields with sensible defaults
    const reminderMethod = "Email";
    const reminderDate = new Date().toISOString().split('T')[0]; // Today
    const reminderNotes = "";

    // Ask if user wants to send an email
    const sendEmail = confirm("Möchten Sie eine Zahlungserinnerung per E-Mail versenden?");

    if (sendEmail) {
        // Send email reminder via server
        fetch(`/payments/${paymentId}/send-reminder-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Fehler beim Versenden der Erinnerungs-E-Mail");
                }
            })
            .then(data => {
                if (data.success) {
                    alert("Zahlungserinnerung wurde per E-Mail versendet");
                    loadPayments(true); // Reload payments to update UI while preserving filter
                } else {
                    alert("Fehler: " + data.message);

                    // If email failed, add manual reminder
                    addManualReminder(paymentId, reminderMethod, reminderDate,
                        "E-Mail konnte nicht versendet werden: " + data.message);
                }
            })
            .catch(error => {
                console.error("Fehler:", error);
                alert(error.message);

                // If email sending failed, add manual reminder
                addManualReminder(paymentId, reminderMethod, reminderDate,
                    "E-Mail konnte nicht versendet werden");
            });
    } else {
        // Add manual reminder
        addManualReminder(paymentId, reminderMethod, reminderDate, reminderNotes);
    }
}

// Helper function to add a manual reminder
function addManualReminder(paymentId, reminderMethod, reminderDate, reminderNotes) {
    fetch(`/payments/${paymentId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            reminderMethod,
            reminderDate,
            reminderNotes
        }),
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Fehler beim Erfassen der Mahnung");
            }
        })
        .then(data => {
            alert("Mahnung erfolgreich erfasst");
            loadPayments(true); // Reload payments to update UI while preserving filter
        })
        .catch(error => {
            console.error("Fehler:", error);
            alert(error.message);
        });
}

// Initiales Laden der Daten
loadMembers();
loadPayments();
loadOrganizationDetails();