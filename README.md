# Cinema Tickets Service

A robust Java 21 implementation of a cinema ticket purchasing system. This project handles input validation, business rule enforcement, seat reservation, and payment processing, while demonstrating clean coding practices and unit testing using a Test-Driven Development (TDD) approach.

---

## Features

- Validates ticket purchase requests against strict business rules
- Supports `ADULT`, `CHILD`, and `INFANT` ticket types
- Calculates total cost and number of seats to reserve
- Integrates with:
  - `TicketPaymentService` (mocked external payment system)
  - `SeatReservationService` (mocked external seat booking system)
- Throws `InvalidPurchaseException` for all invalid scenarios
- Modular and testable code designed with maintainability in mind

---

## Technologies Used

- **Java 21**
- **JUnit 5**
- **Mockito** (for dependency mocking in tests)
- **Maven** (build and dependency management)

---

## TDD & Implementation Approach

This project was implemented using a **Test-Driven Development (TDD)** methodology:

1. **Started with failing unit tests** for edge cases (e.g. infants without adults, too many tickets).
2. **Wrote minimal production code** to pass each test, focusing on clarity and correctness.
3. **Refactored code** for readability and maintainability after green test runs.
4. Ensured **mock interactions** with external services (`makePayment()` and `reserveSeat()`) were asserted.
5. Applied **progressive commits** for every passing test and feature addition.

Business logic and validations were added incrementally alongside tests, ensuring high coverage and confidence in behavior.

---

## Project Structure

```
src/
├── main/
│   └── java/
│       └── uk.gov.dwp.uc.pairtest/
│           ├── TicketService.java
│           ├── TicketServiceImpl.java
│           ├── domain/
│           │   └── TicketTypeRequest.java
│           └── exception/
│               └── InvalidPurchaseException.java
└── test/
    └── java/
        └── uk.gov.dwp.uc.pairtest/
            └── TicketServiceImplTest.java
```

---

## Business Rules

- A maximum of **25 tickets** per purchase (excluding infants)
- At least **one adult ticket** is required if child or infant tickets are present
- **Infants must be accompanied** by one adult each (1:1 ratio)
- Only **adults and children** occupy seats (infants do not)
- Requests must contain **valid ticket types** and a **positive number of tickets**

---

## Usage

1. **Instantiate the service:**
   ```java
   TicketPaymentService paymentService = ...;
   SeatReservationService reservationService = ...;
   TicketService ticketService = new TicketServiceImpl(paymentService, reservationService);
   ```

2. **Purchase tickets:**
   ```java
   TicketTypeRequest[] requests = {
       new TicketTypeRequest(TicketType.ADULT, 2),
       new TicketTypeRequest(TicketType.CHILD, 1)
   };
   ticketService.purchaseTickets(12345L, requests);
   ```

---

## Running Tests

To run all unit tests:

```bash
mvn test
```

- The test suite includes individual test cases for:
  - Null or invalid account IDs
  - Invalid or empty ticket arrays
  - Edge cases for each business rule
  - Correct service invocation verification

Tests are written in `TicketServiceImplTest.java` and use Mockito for mocking external service calls.