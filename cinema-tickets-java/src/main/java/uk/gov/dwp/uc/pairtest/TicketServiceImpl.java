package uk.gov.dwp.uc.pairtest;

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

        TicketTotals totals = calculateTicketTotals(ticketTypeRequests);

        ticketPaymentService.makePayment(accountId, 25);
        seatReservationService.reserveSeat(accountId, 1);

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

}
