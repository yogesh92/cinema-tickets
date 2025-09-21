package uk.gov.dwp.uc.pairtest;

import java.util.Arrays;

import thirdparty.paymentgateway.TicketPaymentService;
import thirdparty.seatbooking.SeatReservationService;
import uk.gov.dwp.uc.pairtest.domain.TicketTypeRequest;
import uk.gov.dwp.uc.pairtest.exception.InvalidPurchaseException;

public class TicketServiceImpl implements TicketService {
    /**
     * Should only have private methods other than the one below.
     */

    private final TicketPaymentService ticketPaymentService;
    private final SeatReservationService seatReservationService;

    private static record TicketTotals(
            int totalTickets,
            int totalAdultTickets,
            int totalChildTickets,
            int totalInfantTickets) {
    }

    public TicketServiceImpl(TicketPaymentService ticketPaymentService, SeatReservationService seatReservationService) {
        if (ticketPaymentService == null || seatReservationService == null) {
            throw new IllegalArgumentException("Services cannot be null");
        }
        this.ticketPaymentService = ticketPaymentService;
        this.seatReservationService = seatReservationService;

    }

    @Override
    public void purchaseTickets(Long accountId, TicketTypeRequest... ticketTypeRequests)
            throws InvalidPurchaseException {

        validateAccountId(accountId);
        validateTicketTypeRequests(ticketTypeRequests);

        TicketTotals totals = calculateTicketTotals(ticketTypeRequests);
        validateTicketTotals(totals);

        ticketPaymentService.makePayment(accountId, 25);
        seatReservationService.reserveSeat(accountId, 1);

    }

    private void validateAccountId(Long accountId) {
        if (accountId == null || accountId <= 0) {
            throw new InvalidPurchaseException("Invalid account ID: " + accountId);
        }
    }

    private void validateTicketTypeRequests(TicketTypeRequest... ticketTypeRequests) {
        if (ticketTypeRequests == null || ticketTypeRequests.length == 0) {
            throw new InvalidPurchaseException("At least one ticket type request must be provided");
        }

        boolean hasInvalidRequest = Arrays.stream(ticketTypeRequests)
                .anyMatch(request -> request == null
                        || request.getTicketType() == null
                        || request.getNoOfTickets() <= 0);

        if (hasInvalidRequest) {
            throw new InvalidPurchaseException("Invalid ticket type request");
        }
    }

    private TicketTotals calculateTicketTotals(TicketTypeRequest... ticketTypeRequests) {

        int totalTickets = 0, adult = 0, child = 0, infant = 0;

        for (TicketTypeRequest request : ticketTypeRequests) {
            int count = request.getNoOfTickets();
            totalTickets += count;

            switch (request.getTicketType()) {
                case ADULT -> adult += count;
                case CHILD -> child += count;
                case INFANT -> infant += count;
            }
        }
        return new TicketTotals(totalTickets, adult, child, infant);
    }

    private void validateTicketTotals(TicketTotals totals) {

        if (totals.totalTickets == 0) {
            throw new InvalidPurchaseException("No tickets requested");
        }
        if (totals.totalTickets > 25) {
            throw new InvalidPurchaseException("Cannot purchase more than " +
                    25 + " tickets at a time");
        }
        if (totals.totalAdultTickets == 0 && (totals.totalChildTickets > 0 || totals.totalInfantTickets > 0)) {
            throw new InvalidPurchaseException(
                    "Child or Infant tickets cannot be purchased without at least one Adult ticket");
        }
        if (totals.totalInfantTickets > totals.totalAdultTickets) {
            throw new InvalidPurchaseException("Each infant must be accompanied by an adult. Too many infants.");
        }

    }

}
