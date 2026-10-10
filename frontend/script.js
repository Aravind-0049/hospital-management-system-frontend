const API_BASE = 'http://localhost:8080/api';

const moduleConfig = {
    patients: { endpoint: '/patients', listId: 'patientsList', title: 'Patients' },
    doctors: { endpoint: '/doctors', listId: 'doctorsList', title: 'Doctors' },
    appointments: { endpoint: '/appointments', listId: 'appointmentsList', title: 'Appointments' },
    billing: { endpoint: '/billing', listId: 'billingList', title: 'Billing' }
};

document.addEventListener('DOMContentLoaded', () => {
    bindModuleButtons();
    bindFormSubmit('patientForm', 'patients', serializePatient);
    bindFormSubmit('doctorForm', 'doctors', serializeDoctor);
    bindFormSubmit('appointmentForm', 'appointments', serializeAppointment);
    bindFormSubmit('billingForm', 'billing', serializeBilling);
    loadDashboard();
    loadModule('patients');
    loadModule('doctors');
    loadModule('appointments');
    loadModule('billing');
});

function showMessage(message, isError = false) {
    const el = document.getElementById('message');
    el.textContent = message;
    el.classList.toggle('error', isError);
}

function bindModuleButtons() {
    document.querySelectorAll('.module-btn').forEach(button => {
        button.addEventListener('click', () => {
            const module = button.dataset.module;
            showMessage(`${moduleConfig[module].title} selected.`);
            loadModule(module);
        });
    });
}

function bindFormSubmit(formId, module, serializer) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const payload = serializer(new FormData(form));

        try {
            const response = await fetch(`${API_BASE}${moduleConfig[module].endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Unable to save record.');
            }

            form.reset();
            showMessage(`${moduleConfig[module].title} saved successfully.`);
            loadModule(module);
            loadDashboard();
        } catch (error) {
            showMessage(error.message, true);
        }
    });
}

function serializePatient(formData) {
    return {
        name: formData.get('name'),
        age: Number(formData.get('age')),
        gender: formData.get('gender'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        medicalHistory: formData.get('medicalHistory') || ''
    };
}

function serializeDoctor(formData) {
    return {
        name: formData.get('name'),
        specialty: formData.get('specialty'),
        department: formData.get('department'),
        phone: formData.get('phone'),
        email: formData.get('email')
    };
}

function serializeAppointment(formData) {
    return {
        patientId: Number(formData.get('patientId')),
        doctorId: Number(formData.get('doctorId')),
        appointmentDate: formData.get('appointmentDate'),
        timeSlot: formData.get('timeSlot'),
        status: formData.get('status') || 'Scheduled'
    };
}

function serializeBilling(formData) {
    return {
        patientId: Number(formData.get('patientId')),
        amount: Number(formData.get('amount')),
        billingType: formData.get('billingType'),
        billingDate: formData.get('billingDate'),
        status: formData.get('status') || 'Pending'
    };
}

async function apiRequest(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
}

async function loadDashboard() {
    try {
        const dashboard = await apiRequest(`${API_BASE}/dashboard`);
        document.getElementById('totalPatients').textContent = dashboard.totalPatients || 0;
        document.getElementById('totalDoctors').textContent = dashboard.totalDoctors || 0;
        document.getElementById('totalAppointments').textContent = dashboard.totalAppointments || 0;
        document.getElementById('totalBilling').textContent = dashboard.totalBilling || 0;
    } catch (error) {
        showMessage('Backend is not reachable. Please start the Spring Boot server.', true);
    }
}

async function loadModule(module) {
    const config = moduleConfig[module];
    const container = document.getElementById(config.listId);
    if (!container) return;

    try {
        const items = await apiRequest(`${API_BASE}${config.endpoint}`);
        container.innerHTML = renderTable(items, module);
    } catch (error) {
        container.innerHTML = '<p>Unable to load data.</p>';
    }
}

function renderTable(items, module) {
    if (!items || items.length === 0) {
        return '<p>No records available.</p>';
    }

    if (module === 'patients') {
        return `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Phone</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.age}</td>
                            <td>${item.gender}</td>
                            <td>${item.phone}</td>
                            <td>${item.email}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    if (module === 'doctors') {
        return `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Specialty</th>
                        <th>Department</th>
                        <th>Phone</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.specialty}</td>
                            <td>${item.department}</td>
                            <td>${item.phone}</td>
                            <td>${item.email}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    if (module === 'appointments') {
        return `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.patient?.name || item.patientId || 'N/A'}</td>
                            <td>${item.doctor?.name || item.doctorId || 'N/A'}</td>
                            <td>${item.appointmentDate}</td>
                            <td>${item.timeSlot}</td>
                            <td>${item.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    return `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.patient?.name || item.patientId || 'N/A'}</td>
                        <td>${item.billingType}</td>
                        <td>$${Number(item.amount || 0).toFixed(2)}</td>
                        <td>${item.status}</td>
                        <td>${item.billingDate}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
