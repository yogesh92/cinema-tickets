import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';

test("creates a valid request for ADULT", () => {
  const req = new TicketTypeRequest("ADULT", 3);
  expect(req.getTicketType()).toBe("ADULT");
  expect(req.getNoOfTickets()).toBe(3);
});

test("creates a valid request for CHILD", () => {
  const req = new TicketTypeRequest("CHILD", 1);
  expect(req.getTicketType()).toBe("CHILD");
  expect(req.getNoOfTickets()).toBe(1);
});

test("creates a valid request for INFANT", () => {
  const req = new TicketTypeRequest("INFANT", 2);
  expect(req.getTicketType()).toBe("INFANT");
  expect(req.getNoOfTickets()).toBe(2);
});

test("throws error for invalid ticket type", () => {
  expect(() => new TicketTypeRequest("STUDENT", 1)).toThrow("type must be ADULT, CHILD, or INFANT");
});

test("throws error for zero or negative ticket count", () => {
  expect(() => new TicketTypeRequest("ADULT", 0)).toThrow("noOfTickets must be an integer");
  expect(() => new TicketTypeRequest("CHILD", -2)).toThrow("noOfTickets must be an integer");
});

test("throws error for non-integer ticket count", () => {
  expect(() => new TicketTypeRequest("ADULT", 1.5)).toThrow("noOfTickets must be an integer");
  expect(() => new TicketTypeRequest("INFANT", NaN)).toThrow("noOfTickets must be an integer");
});

test("is immutable", () => {
  const req = new TicketTypeRequest("CHILD", 1);
  expect(() => {
    req._type = "ADULT";
  }).toThrow();
});