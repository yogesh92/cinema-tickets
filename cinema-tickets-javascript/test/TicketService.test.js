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

test("processes valid purchase (2 ADULT, 1 CHILD, 1 INFANT) correctly", () => {
  const ticketService = new TicketService(
    mockTicketPaymentService,
    mockSeatReservationService
  );

  const requests = [
    new TicketTypeRequest("ADULT", 2),
    new TicketTypeRequest("CHILD", 1),
    new TicketTypeRequest("INFANT", 1),
  ];

  ticketService.purchaseTickets(1, ...requests);

  expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 65); // (2x25 + 1x15)
  expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 3); // 2 adults + 1 child
});

test("throws error for invalid account ID", () => {
  const ticketService = new TicketService(
    mockTicketPaymentService,
    mockSeatReservationService
  );
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
});

test("throws error when child or infant tickets are requested without an adult", () => {
  const ticketService = new TicketService(
    mockTicketPaymentService,
    mockSeatReservationService
  );

  const childOnly = [new TicketTypeRequest("CHILD", 1)];
  const infantOnly = [new TicketTypeRequest("INFANT", 1)];

  expect(() => ticketService.purchaseTickets(1, ...childOnly)).toThrow(
    InvalidPurchaseException
  );
  expect(() => ticketService.purchaseTickets(1, ...infantOnly)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when ticket totals exceed max limit", () => {
  const ticketService = new TicketService(
    mockTicketPaymentService,
    mockSeatReservationService
  );

  const request = new TicketTypeRequest("ADULT", 29); // over 20
  expect(() => ticketService.purchaseTickets(1, request)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when there are more infants than adults", () => {
  const ticketService = new TicketService(
    mockTicketPaymentService,
    mockSeatReservationService
  );

  const requests = [
    new TicketTypeRequest("ADULT", 1),
    new TicketTypeRequest("INFANT", 2),
  ];

  expect(() => ticketService.purchaseTickets(1, ...requests)).toThrow(
    InvalidPurchaseException
  );
});

test("throws error when no tickets are requested", () => {

  const ticketService = new TicketService(
    mockTicketPaymentService,
    mockSeatReservationService
  );

  expect(() => ticketService.purchaseTickets(1)).toThrow(
    InvalidPurchaseException
  );
});
