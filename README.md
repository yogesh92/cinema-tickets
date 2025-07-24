# Cinema Ticket Booking System

A Node.js implementation of a ticket booking service that calculates payment and seat reservations based on business constraints. Built as part of the DWP Digital Engineering recruitment process.

## 🧾 Business Rules

- There are 3 ticket types: **ADULT**, **CHILD**, and **INFANT**.
- Ticket prices:
  - ADULT: £25
  - CHILD: £15
  - INFANT: £0 (no seat allocated)
- Only a **maximum of 25 tickets** can be purchased at a time (excluding INFANTS).
- A ticket purchase **must include at least one ADULT** if there are any CHILD or INFANT tickets.
- Number of INFANT tickets **cannot exceed** number of ADULT tickets.
- Tickets must be requested via a valid `TicketTypeRequest`.

## 🛠️ Tech Stack

- **Node.js** 20+
- **Jest** for unit testing
- **ESLint** for linting
- JavaScript ES Modules

## 📁 Project Structure

```bash
cinema-tickets/
├── src/
│   ├── pairtest/
│   │   ├── TicketService.js
│   │   ├── config/
│   │   │   └── ticketConfig.js
│   │   └── lib/
│   │       ├── TicketTypeRequest.js
│   │       └── InvalidPurchaseException.js
│   └── thirdparty/
│       ├── paymentgateway/
│       │   └── TicketPaymentService.js
│       └── seatbooking/
│           └── SeatReservationService.js
├── test/
│   ├── TicketService.test.js
│   └── TicketTypeRequest.test.js
├── package.json
├── .babelrc
```


## ✅ How to Run

### 1. Install dependencies

```bash
npm install
```

### 2. Run the tests

```bash
npm test
```

### 3. (Optional) Run coverage report

```bash
npm run test coverage
```

## 🧪 Test Coverage

- All business logic is fully covered through Jest unit tests.
- Edge cases are tested: invalid inputs, maximum ticket limits, missing adults, and malformed requests.

## 🧑‍💻 Author Info

- **Candidate Number:** 14470699
- **Campaign Number:**  406891

## 📬 Submission Notes

- This project is my original work, completed for the DWP Digital recruitment process.
- The solution adheres to all business rules and interface constraints.
