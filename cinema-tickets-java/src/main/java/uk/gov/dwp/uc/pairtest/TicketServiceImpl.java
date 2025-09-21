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
        boolean hasAdult = false;
        boolean hasChildOrInfant = false;
        int totalTickets = 0;

        for (TicketTypeRequest request : ticketTypeRequests) {
            totalTickets += request.getNoOfTickets();
            switch (request.getTicketType()) {
                case ADULT -> hasAdult = true;
                case CHILD, INFANT -> hasChildOrInfant = true;
            }
        }

        if (hasChildOrInfant && !hasAdult) {
            throw new InvalidPurchaseException("Child or Infant cannot be purchased without Adult");
        }

        if (totalTickets > 25) {
            throw new InvalidPurchaseException("Cannot purchase more than 25 tickets");
        }

        ticketPaymentService.makePayment(accountId, 25);
        seatReservationService.reserveSeat(accountId, 1);

    }

}
