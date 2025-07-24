/* eslint-disable no-undef */
import TicketService from "../src/pairtest/TicketService.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException.js";

const mockTicketPaymentService = {
  makePayment: jest.fn(),
};

const mockSeatReservationService = {
  reserveSeat: jest.fn(),
};

let ticketService;

beforeEach(() => {
  // Reset mocks and re-initialize service before each test
  jest.clearAllMocks();
  ticketService = new TicketService(
    mockTicketPaymentService,
    mockSeatReservationService
  );
});

test("processes valid purchase with one ADULT ticket", () => {
  const request = new TicketTypeRequest("ADULT", 1);

  ticketService.purchaseTickets(1, request);

  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 25);
  expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 1);
});

test("processes valid purchase with one ADULT ticket and CHILD ticket ", () => {
    const requests = [
    new TicketTypeRequest("ADULT", 1),
    new TicketTypeRequest("CHILD", 1),
  ];

  ticketService.purchaseTickets(1, ...requests);

  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 40);
  expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 2);
});

test("processes valid purchase 2 ADULT, 1 CHILD, 1 INFANT correctly", () => {
  const requests = [
    new TicketTypeRequest("ADULT", 2),
    new TicketTypeRequest("CHILD", 1),
    new TicketTypeRequest("INFANT", 1),
  ];

  ticketService.purchaseTickets(1, ...requests);

  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 65); // (2x25 + 1x15)
  expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 3); // 2 adults + 1 child
});

test("INFANT tickets do not add to seat reservation", () => {
  const reqs = [
    new TicketTypeRequest("ADULT", 2),
    new TicketTypeRequest("INFANT", 2),
  ];
  ticketService.purchaseTickets(1, ...reqs);
  expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 2); // Not 4
});

test("processes valid purchase at max ticket limit with mixed types", () => {
  const requests = [
    new TicketTypeRequest("ADULT", 10),
    new TicketTypeRequest("CHILD", 10),
    new TicketTypeRequest("INFANT", 5),
  ];
  ticketService.purchaseTickets(1, ...requests);
  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 400);
  expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 20); // INFANT doesn't get a seat
});

test("processes valid purchase with exactly 25 tickets", () => {
  const reqs = [
    new TicketTypeRequest("ADULT", 15),
    new TicketTypeRequest("CHILD", 10),
  ];
  ticketService.purchaseTickets(1, ...reqs);
  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 525); // 15*25 + 10*15
  expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 25);
});

test("throws error for invalid account ID", () => {
  const request = new TicketTypeRequest("ADULT", 1);

  expect(() => ticketService.purchaseTickets(0, request)).toThrow(
    InvalidPurchaseException
  );
  expect(() => ticketService.purchaseTickets(-1, request)).toThrow(
    InvalidPurchaseException
  );
  expect(() => ticketService.purchaseTickets("abc", request)).toThrow(
    InvalidPurchaseException
  );
  expect(() => ticketService.purchaseTickets(1.5, request)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when TicketService receives zero or negative ticket count", () => {
  const invalidZero = new TicketTypeRequest("ADULT", 0);
  const invalidNegative = new TicketTypeRequest("ADULT", -2);

  expect(() => ticketService.purchaseTickets(1, invalidZero)).toThrow(
    InvalidPurchaseException
  );

  expect(() => ticketService.purchaseTickets(1, invalidNegative)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when all ticket counts are zero", () => {
  const reqs = [
    new TicketTypeRequest("ADULT", 0),
    new TicketTypeRequest("CHILD", 0),
    new TicketTypeRequest("INFANT", 0),
  ];
  expect(() => ticketService.purchaseTickets(1, ...reqs)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error for malformed TicketTypeRequest-like object", () => {
  const invalidRequest = { type: "ADULT", noOfTickets: 1 };

  expect(() => ticketService.purchaseTickets(1, invalidRequest)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when a mix of valid and malformed requests are given", () => {
  const valid = new TicketTypeRequest("ADULT", 1);
  const invalid = { type: "CHILD", noOfTickets: 2 }; // not a valid TicketTypeRequest instance
  expect(() => ticketService.purchaseTickets(1, valid, invalid)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when child or infant tickets are requested without an adult", () => {
  const childOnly = new TicketTypeRequest("CHILD", 1);
  const infantOnly = new TicketTypeRequest("INFANT", 1);

  expect(() => ticketService.purchaseTickets(1, childOnly)).toThrow(
    InvalidPurchaseException
  );
  expect(() => ticketService.purchaseTickets(1, infantOnly)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when ticket totals exceed max limit", () => {
  const request = new TicketTypeRequest("ADULT", 29);
  expect(() => ticketService.purchaseTickets(1, request)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when valid types add up to over 25", () => {
  const reqs = [
    new TicketTypeRequest("ADULT", 15),
    new TicketTypeRequest("CHILD", 10),
    new TicketTypeRequest("INFANT", 2),
  ];
  expect(() => ticketService.purchaseTickets(1, ...reqs)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when there are more infants than adults", () => {
  const requests = [
    new TicketTypeRequest("ADULT", 1),
    new TicketTypeRequest("INFANT", 2),
  ];

  expect(() => ticketService.purchaseTickets(1, ...requests)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when no tickets are requested", () => {
  expect(() => ticketService.purchaseTickets(1)).toThrow(
    InvalidPurchaseException
  );
});

test("multiple purchases do not interfere with each other", () => {
  const req1 = new TicketTypeRequest("ADULT", 1);
  const req2 = new TicketTypeRequest("ADULT", 2);

  ticketService.purchaseTickets(1, req1);
  ticketService.purchaseTickets(2, req2);

  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 25);
  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(2, 50);
});
