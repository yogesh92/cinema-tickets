package uk.gov.dwp.uc.pairtest;

import java.util.Arrays;
import java.util.Objects;

import thirdparty.paymentgateway.TicketPaymentService;
import thirdparty.seatbooking.SeatReservationService;
import uk.gov.dwp.uc.pairtest.domain.TicketTypeRequest;
import uk.gov.dwp.uc.pairtest.exception.InvalidPurchaseException;

/**
 * Implementation of {@link TicketService} for purchasing cinema tickets.
 * Handles validation, payment, and seat reservation logic.
 */
public class TicketServiceImpl implements TicketService {
    /**
     * Should only have private methods other than the one below.
     */

    private final TicketPaymentService ticketPaymentService;
    private final SeatReservationService seatReservationService;

    /**
     * Holds totals for ticket types in a purchase request.
     *
     * @param totalTickets        Total number of tickets requested
     * @param totalAdultTickets   Number of adult tickets
     * @param totalChildTickets   Number of child tickets
     * @param totalInfantTickets  Number of infant tickets
     */
    private static record TicketTotals(
            int totalTickets,
            int totalAdultTickets,
            int totalChildTickets,
            int totalInfantTickets) {
    }

    /** Maximum tickets allowed per purchase */
    private static final int MAX_TICKETS = 25;
    /** Price per adult ticket */
    private static final int ADULT_TICKET_PRICE = 25;
    /** Price per child ticket */
    private static final int CHILD_TICKET_PRICE = 15;

    /**
     * Constructs a TicketServiceImpl with required payment and seat reservation services.
     *
     * @param ticketPaymentService     Service for processing payments
     * @param seatReservationService   Service for reserving seats
     * @throws NullPointerException if any service is null
     */
    public TicketServiceImpl(TicketPaymentService ticketPaymentService, SeatReservationService seatReservationService) {
        this.ticketPaymentService = Objects.requireNonNull(ticketPaymentService,
                "ticketPaymentService must not be null");
        this.seatReservationService = Objects.requireNonNull(seatReservationService,
                "seatReservationService must not be null");

    }

    /**
     * Purchases tickets for the given account and ticket type requests.
     * Validates input, calculates totals, reserves seats, and processes payment.
     *
     * @param accountId           Account ID making the purchase
     * @param ticketTypeRequests  Array of ticket type requests
     * @throws InvalidPurchaseException if validation fails
     */
    @Override
    public void purchaseTickets(Long accountId, TicketTypeRequest... ticketTypeRequests)
            throws InvalidPurchaseException {

        validateAccountId(accountId);
        validateTicketTypeRequests(ticketTypeRequests);

        TicketTotals totals = calculateTicketTotals(ticketTypeRequests);
        validateTicketTotals(totals);

        int totalAmountToPay = calculateTotalAmount(totals);
        int totalSeatsToReserve = calculateSeatsToReserve(totals);

        seatReservationService.reserveSeat(accountId, totalSeatsToReserve);
        ticketPaymentService.makePayment(accountId, totalAmountToPay);

    }

    /**
     * Validates the account ID.
     *
     * @param accountId Account ID to validate
     * @throws InvalidPurchaseException if account ID is invalid
     */
    private void validateAccountId(Long accountId) {
        if (accountId == null || accountId <= 0) {
            throw new InvalidPurchaseException("Invalid account ID: " + accountId);
        }
    }

    /**
     * Validates the ticket type requests.
     *
     * @param ticketTypeRequests Array of ticket type requests
     * @throws InvalidPurchaseException if requests are invalid
     */
    private void validateTicketTypeRequests(final TicketTypeRequest... ticketTypeRequests) {
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

    /**
     * Calculates totals for each ticket type.
     *
     * @param ticketTypeRequests Array of ticket type requests
     * @return TicketTotals containing counts for each type
     */
    private TicketTotals calculateTicketTotals(final TicketTypeRequest... ticketTypeRequests) {

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

    /**
     * Validates the calculated ticket totals against business rules.
     *
     * @param totals TicketTotals to validate
     * @throws InvalidPurchaseException if totals violate rules
     */
    private void validateTicketTotals(final TicketTotals totals) {

        if (totals.totalTickets == 0) {
            throw new InvalidPurchaseException("No tickets requested");
        }
        if (totals.totalTickets > MAX_TICKETS) {
            throw new InvalidPurchaseException("Cannot purchase more than " +
                    MAX_TICKETS + " tickets at a time");
        }
        if (totals.totalAdultTickets == 0 && (totals.totalChildTickets > 0 || totals.totalInfantTickets > 0)) {
            throw new InvalidPurchaseException(
                    "Child or Infant tickets cannot be purchased without at least one Adult ticket");
        }
        if (totals.totalInfantTickets > totals.totalAdultTickets) {
            throw new InvalidPurchaseException("Each infant must be accompanied by an adult. Too many infants.");
        }

    }

    /**
     * Calculates the total payment amount for the tickets.
     *
     * @param totals TicketTotals containing ticket counts
     * @return Total amount to pay
     */
    private int calculateTotalAmount(final TicketTotals totals) {
        return totals.totalAdultTickets * ADULT_TICKET_PRICE +
                totals.totalChildTickets * CHILD_TICKET_PRICE;
    }

    /**
     * Calculates the total number of seats to reserve (excluding infants).
     *
     * @param totals TicketTotals containing ticket counts
     * @return Number of seats to reserve
     */
    private int calculateSeatsToReserve(final TicketTotals totals) {
        return totals.totalAdultTickets + totals.totalChildTickets;
    }

}
