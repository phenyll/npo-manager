const membersTable = document.getElementById("membersTable");
const paymentsTable = document.getElementById("paymentsTable");
const searchInput = document.getElementById("searchInput");
const paymentSearchInput = document.getElementById("paymentSearchInput");
const paymentStatusFilter = document.getElementById("paymentStatusFilter");

function filterPayments() {
  const searchFilter = paymentSearchInput.value.toLowerCase();
  const statusFilter = paymentStatusFilter ? paymentStatusFilter.value : '';
  const rows = document.querySelectorAll('#paymentsTable tr');
  
  rows.forEach(row => {
    const memberIdCell = row.querySelector('td:first-child');
    const statusCell = row.querySelector('td:nth-child(4)'); // Status-Spalte
    
    // Text-basierte Suche
    const searchMatches = !searchFilter || (memberIdCell && searchFilter.split(' ').every(word => 
      memberIdCell.textContent.toLowerCase().includes(word)
    ));
    
    // Status-Filter
    const statusMatches = !statusFilter || (statusCell && statusCell.textContent.toLowerCase().includes(statusFilter));
    
    // Zeile anzeigen nur wenn beide Filter passen
    row.style.display = searchMatches && statusMatches ? '' : 'none';
  });
}

paymentSearchInput.addEventListener("input", filterPayments);
if (paymentStatusFilter) {
  paymentStatusFilter.addEventListener("change", filterPayments);
}

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

// Mitglieder laden (erweitert für Filter und neue Spalten)
function loadMembers() {
    // Filter aus dem UI abrufen
    const filters = getFiltersFromUI();
    
    // URL Parameter für Filter aufbauen
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null) {
            params.append(key, filters[key]);
        }
    });
    
    // API-Endpoint basierend auf Filter wählen
    const endpoint = params.toString() ? `/members/filtered?${params.toString()}` : "/members";
    
    console.log("Loading members from:", endpoint);
    
    fetch(endpoint)
      .then((response) => {
          console.log("Response status:", response.status);
          if (response.status === 401) {
              window.location.href = "/login";
              return;
          }
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Check if response has content
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Response is not JSON");
          }
          
          return response.json();
      })
      .then((data) => {
        console.log("Received data:", data);
        
        // Speichern für andere Funktionen
        window.members = data.members || data;
        
        // Statistiken aktualisieren (falls vorhanden)
        if (data.statistics) {
            updateSummaryStats(data.statistics);
        }
        
        const searchQuery = searchInput.value.toLowerCase();
        const membersToDisplay = data.members || data;
        
        const filteredMembers = membersToDisplay.filter((member) => {
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
              <td>${member.total_open_amount ? member.total_open_amount.toFixed(2) + ' €' : '0.00 €'}</td>
              <td>${member.has_email ? 'Ja' : 'Nein'}</td>
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
      })
      .catch((error) => {
        console.error("Error loading members:", error);
        alert("Fehler beim Laden der Mitgliederdaten: " + error.message);
        
        // Fallback: Load regular members if filtered fails
        if (params.toString()) {
            console.log("Falling back to regular members load...");
            fetch("/members")
                .then(response => response.json())
                .then(data => {
                    window.members = data.members || data;
                    // Re-render table with fallback data
                    const searchQuery = searchInput.value.toLowerCase();
                    const filteredMembers = window.members.filter((member) => {
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
                          <td>0.00 €</td>
                          <td>${member.email ? 'Ja' : 'Nein'}</td>
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
                })
                .catch(fallbackError => {
                    console.error("Fallback also failed:", fallbackError);
                    membersTable.innerHTML = '<tr><td colspan="12" class="text-center text-danger">Fehler beim Laden der Mitgliederdaten</td></tr>';
                });
        }
      });
  }

  function viewMemberPayments(memberId) {
    const paymentsTab = new bootstrap.Tab(document.querySelector('#payments-tab'));
    paymentsTab.show();
    paymentSearchInput.value = `${memberId} ${window.members.find(m => m.id === memberId).firstName} ${window.members.find(m => m.id === memberId).lastName}`;
    if (paymentStatusFilter) {
      paymentStatusFilter.value = ''; // Reset status filter when viewing specific member
    }
    filterPayments();
  }
  
  //Beiträge laden
  function loadPayments(preserveFilter = true) {
      const currentSearchFilter = preserveFilter ? paymentSearchInput.value : '';
      const currentStatusFilter = preserveFilter && paymentStatusFilter ? paymentStatusFilter.value : '';

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

                      // Re-apply filters if we're preserving them
                      if (currentSearchFilter || currentStatusFilter) {
                          paymentSearchInput.value = currentSearchFilter;
                          if (paymentStatusFilter) {
                              paymentStatusFilter.value = currentStatusFilter;
                          }
                          filterPayments();
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

// Filter-Hilfsfunktionen
function getFiltersFromUI() {
    const openPaymentsFilter = document.getElementById('filterOpenPayments');
    const actualExitFilter = document.getElementById('filterActualExit');
    const expectedExitFilter = document.getElementById('filterExpectedExit');
    const autoExitFilter = document.getElementById('filterAutoExit');
    const emailFilter = document.getElementById('filterHasEmail');
    const joinDateFromFilter = document.getElementById('filterJoinDateFrom');
    const joinDateToFilter = document.getElementById('filterJoinDateTo');
    
    return {
        hasOpenPayments: openPaymentsFilter ? openPaymentsFilter.value : '',
        hasActualExit: actualExitFilter ? actualExitFilter.value : '',
        hasExpectedExit: expectedExitFilter ? expectedExitFilter.value : '',
        hasAutoExit: autoExitFilter ? autoExitFilter.value : '',
        hasEmail: emailFilter ? emailFilter.value : '',
        joinDateFrom: joinDateFromFilter ? joinDateFromFilter.value : '',
        joinDateTo: joinDateToFilter ? joinDateToFilter.value : ''
    };
}

function updateSummaryStats(statistics) {
    const totalCountElement = document.getElementById('summaryCount');
    const totalOpenAmountElement = document.getElementById('summaryOpenAmount');
    const exitedCountElement = document.getElementById('summaryExited');
    const autoExitCountElement = document.getElementById('summaryAutoExit');
    
    if (totalCountElement) {
        totalCountElement.textContent = statistics.totalCount || 0;
    }
    if (totalOpenAmountElement) {
        totalOpenAmountElement.textContent = (statistics.totalOpenAmount || 0).toFixed(2) + ' €';
    }
    if (exitedCountElement) {
        exitedCountElement.textContent = statistics.exitedCount || 0;
    }
    if (autoExitCountElement) {
        autoExitCountElement.textContent = statistics.autoExitCount || 0;
    }
}

function exportExcel() {
    const filters = getFiltersFromUI();
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null) {
            params.append(key, filters[key]);
        }
    });
    
    const url = params.toString() ? `/members/export?${params.toString()}` : '/members/export';
    
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mitgliederliste_gefiltert_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Fehler beim Excel-Export:', error);
            alert('Fehler beim Exportieren der Excel-Datei');
        });
}

function setupFilterEventListeners() {
    // Event-Listener für alle Filter hinzufügen
    const filterElements = [
        'filterOpenPayments',
        'filterActualExit', 
        'filterExpectedExit',
        'filterAutoExit',
        'filterHasEmail',
        'filterJoinDateFrom',
        'filterJoinDateTo'
    ];
    
    filterElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', () => {
                loadMembers(); // Tabelle neu laden mit neuen Filtern
            });
        }
    });
    
    // Event-Listener für Export-Button
    const exportButton = document.getElementById('exportFilteredBtn');
    if (exportButton) {
        exportButton.addEventListener('click', exportExcel);
    }
}

// Beim DOM-Load die Event-Listener einrichten
document.addEventListener('DOMContentLoaded', function() {
    setupFilterEventListeners();
});

// Initiales Laden der Daten
loadMembers();
loadPayments();
loadOrganizationDetails();

function resetFilters() {
    const filterElements = [
        'filterOpenPayments',
        'filterActualExit', 
        'filterExpectedExit',
        'filterAutoExit',
        'filterHasEmail',
        'filterJoinDateFrom',
        'filterJoinDateTo'
    ];
    
    filterElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = '';
        }
    });
    loadMembers(); // Tabelle neu laden ohne Filter
}