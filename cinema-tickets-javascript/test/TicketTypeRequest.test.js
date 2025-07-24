/* eslint-disable no-undef */
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";

test("creates a valid request for ADULT", () => {
  const request = new TicketTypeRequest("ADULT", 3);
  expect(request.getTicketType()).toBe("ADULT");
  expect(request.getNoOfTickets()).toBe(3);
});

test("creates a valid request for CHILD", () => {
  const request = new TicketTypeRequest("CHILD", 1);
  expect(request.getTicketType()).toBe("CHILD");
  expect(request.getNoOfTickets()).toBe(1);
});

test("creates a valid request for INFANT", () => {
  const request = new TicketTypeRequest("INFANT", 2);
  expect(request.getTicketType()).toBe("INFANT");
  expect(request.getNoOfTickets()).toBe(2);
});

test("throws error for invalid ticket type", () => {
  expect(() => new TicketTypeRequest("STUDENT", 1)).toThrow(
    "type must be ADULT, CHILD, or INFANT"
  );
});

test("throws error for non-integer ticket count", () => {
  expect(() => new TicketTypeRequest("ADULT", 1.5)).toThrow(
    "noOfTickets must be an integer"
  );
  expect(() => new TicketTypeRequest("INFANT", NaN)).toThrow(
    "noOfTickets must be an integer"
  );
});

test("throws error for empty string as ticket type", () => {
  expect(() => new TicketTypeRequest("", 2)).toThrow(
    "type must be ADULT, CHILD, or INFANT"
  );
});

test("throws error when ticket count is a string number", () => {
  expect(() => new TicketTypeRequest("ADULT", "3")).toThrow(
    "noOfTickets must be an integer"
  );
});
