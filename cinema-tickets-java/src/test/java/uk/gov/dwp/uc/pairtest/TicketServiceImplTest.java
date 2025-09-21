package uk.gov.dwp.uc.pairtest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import thirdparty.paymentgateway.TicketPaymentService;
import thirdparty.seatbooking.SeatReservationService;
import uk.gov.dwp.uc.pairtest.domain.TicketTypeRequest;
import uk.gov.dwp.uc.pairtest.domain.TicketTypeRequest.Type;
import uk.gov.dwp.uc.pairtest.exception.InvalidPurchaseException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("TicketServiceImplTest")
public class TicketServiceImplTest {

    @Mock
    private TicketPaymentService paymentService;

    @Mock
    private SeatReservationService seatService;

    private TicketService ticketService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ticketService = new TicketServiceImpl(paymentService, seatService);
    }

    @Nested
    @DisplayName("Valid Purchase Scenarios")
    class ValidPurchases {

        @Test
        void testAdultOnlyPurchaseIsValid() {
            TicketTypeRequest adult = new TicketTypeRequest(Type.ADULT, 1);
            ticketService.purchaseTickets(1L, adult);

            verify(paymentService).makePayment(1L, 25);
            verify(seatService).reserveSeat(1L, 1);
        }

        @Test
        void testValidAdultChildInfantPurchase() {
            TicketTypeRequest adult = new TicketTypeRequest(Type.ADULT, 2);
            TicketTypeRequest child = new TicketTypeRequest(Type.CHILD, 3);
            TicketTypeRequest infant = new TicketTypeRequest(Type.INFANT, 1);

            ticketService.purchaseTickets(10L, adult, child, infant);

            verify(paymentService).makePayment(10L, 95);
            verify(seatService).reserveSeat(10L, 5);
        }

        @Test
        void testAggregateAdultRequests() {
            TicketTypeRequest req1 = new TicketTypeRequest(Type.ADULT, 2);
            TicketTypeRequest req2 = new TicketTypeRequest(Type.ADULT, 3);

            ticketService.purchaseTickets(1L, req1, req2);

            verify(paymentService).makePayment(1L, 125);
            verify(seatService).reserveSeat(1L, 5);
        }

        @Test
        void testPurchaseWithExactly25Tickets() {
            TicketTypeRequest request = new TicketTypeRequest(Type.ADULT, 25);
            ticketService.purchaseTickets(1L, request);

            verify(paymentService).makePayment(1L, 625);
            verify(seatService).reserveSeat(1L, 25);
        }

        @Test
        void testMaxTicketsWithMixedTypes() {
            TicketTypeRequest adult = new TicketTypeRequest(Type.ADULT, 10);
            TicketTypeRequest child = new TicketTypeRequest(Type.CHILD, 10);
            TicketTypeRequest infant = new TicketTypeRequest(Type.INFANT, 5);

            ticketService.purchaseTickets(1L, adult, child, infant);

            verify(paymentService).makePayment(1L, 400);
            verify(seatService).reserveSeat(1L, 20); // INFANT doesn't get a seat
        }

        @Test
        void testMultiplePurchasesAreIndependent() {
            TicketTypeRequest req1 = new TicketTypeRequest(Type.ADULT, 1);
            TicketTypeRequest req2 = new TicketTypeRequest(Type.ADULT, 2);

            ticketService.purchaseTickets(1L, req1);
            ticketService.purchaseTickets(2L, req2);

            verify(paymentService).makePayment(1L, 25);
            verify(paymentService).makePayment(2L, 50);
            verify(seatService).reserveSeat(1L, 1);
            verify(seatService).reserveSeat(2L, 2);
        }
    }

    @Nested
    @DisplayName("Invalid Purchase Scenarios")
    class InvalidPurchases {

        @Test
        void testChildTicketWithoutAdultThrowsException() {
            TicketTypeRequest child = new TicketTypeRequest(Type.CHILD, 1);

            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(1L, child));
            verifyNoInteractions(paymentService, seatService);
        }

        @Test
        void testInfantOnlyPurchaseThrowsException() {
            TicketTypeRequest infantOnly = new TicketTypeRequest(Type.INFANT, 1);

            InvalidPurchaseException exception = assertThrows(InvalidPurchaseException.class,
                    () -> ticketService.purchaseTickets(1L, infantOnly));

            assertEquals("Child or Infant tickets cannot be purchased without at least one Adult ticket",
                    exception.getMessage());
            verifyNoInteractions(paymentService, seatService);
        }

        @Test
        void testPurchaseExceedingMax25TicketsThrowsException() {
            TicketTypeRequest adult20 = new TicketTypeRequest(Type.ADULT, 20);
            TicketTypeRequest child6 = new TicketTypeRequest(Type.CHILD, 6);

            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(1L, adult20, child6));
            verifyNoInteractions(paymentService, seatService);
        }

        @Test
        void testMoreInfantsThanAdultsThrowsException() {
            TicketTypeRequest oneAdult = new TicketTypeRequest(Type.ADULT, 1);
            TicketTypeRequest twoInfants = new TicketTypeRequest(Type.INFANT, 2);

            InvalidPurchaseException exception = assertThrows(InvalidPurchaseException.class,
                    () -> ticketService.purchaseTickets(1L, oneAdult, twoInfants));

            assertEquals("Each infant must be accompanied by an adult. Too many infants.", exception.getMessage());
            verifyNoInteractions(paymentService, seatService);
        }

        @Test
        void testAllTicketCountsZeroThrowsException() {
            TicketTypeRequest adult = new TicketTypeRequest(Type.ADULT, 0);
            TicketTypeRequest child = new TicketTypeRequest(Type.CHILD, 0);
            TicketTypeRequest infant = new TicketTypeRequest(Type.INFANT, 0);

            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(1L, adult, child, infant));
        }

        @Test
        void testInvalidAccountIdThrowsException() {
            TicketTypeRequest oneAdult = new TicketTypeRequest(Type.ADULT, 1);

            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(0L, oneAdult));
            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(-5L, oneAdult));
            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(null, oneAdult));
        }

        @Test
        void testNullTicketRequestsThrowsException() {
            assertThrows(InvalidPurchaseException.class,
                    () -> ticketService.purchaseTickets(1L, (TicketTypeRequest[]) null));
        }

        @Test
        void testEmptyTicketRequestsThrowsException() {
            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(1L));
        }

        @Test
        void testNullTicketRequestInArrayThrowsException() {
            TicketTypeRequest nullRequest = null;
            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(1L, nullRequest));
        }

        @Test
        void testInvalidTicketTypeOrCountThrowsException() {
            TicketTypeRequest badRequest1 = new TicketTypeRequest(null, 1);
            TicketTypeRequest badRequest2 = new TicketTypeRequest(Type.ADULT, 0);
            TicketTypeRequest badRequest3 = new TicketTypeRequest(Type.ADULT, -1);

            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(1L, badRequest1));
            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(1L, badRequest2));
            assertThrows(InvalidPurchaseException.class, () -> ticketService.purchaseTickets(1L, badRequest3));
        }
    }
}