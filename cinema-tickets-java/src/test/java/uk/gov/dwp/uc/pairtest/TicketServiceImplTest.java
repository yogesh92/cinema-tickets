package uk.gov.dwp.uc.pairtest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import thirdparty.paymentgateway.TicketPaymentService;
import thirdparty.seatbooking.SeatReservationService;
import uk.gov.dwp.uc.pairtest.domain.TicketTypeRequest;
import uk.gov.dwp.uc.pairtest.domain.TicketTypeRequest.Type;
import uk.gov.dwp.uc.pairtest.exception.InvalidPurchaseException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

public class TicketServiceImplTest {

    @Mock
    private TicketPaymentService paymentService;

    @Mock
    private SeatReservationService seatService;

    private TicketService ticketService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        ticketService = new TicketServiceImpl(paymentService, seatService);
    }

    @Test
    public void testAdultOnlyPurchaseIsValid() {
        TicketTypeRequest adult = new TicketTypeRequest(Type.ADULT, 1);

        ticketService.purchaseTickets(1L, adult);

        verify(paymentService).makePayment(1L, 25);
        verify(seatService).reserveSeat(1L, 1);
    }

    @Test
    public void testChildTicketWithoutAdultThrowsException() {
        TicketTypeRequest child = new TicketTypeRequest(Type.CHILD, 1);

        assertThrows(InvalidPurchaseException.class, () -> {
            ticketService.purchaseTickets(1L, child);
        });

        verifyNoInteractions(paymentService);
        verifyNoInteractions(seatService);
    }

    @Test
    void shouldThrowExceptionForInfantOnlyPurchase() {
        TicketTypeRequest infantOnly = new TicketTypeRequest(TicketTypeRequest.Type.INFANT, 1);

        InvalidPurchaseException exception = assertThrows(
                InvalidPurchaseException.class,
                () -> ticketService.purchaseTickets(1L, infantOnly));

        assertEquals("Child or Infant tickets cannot be purchased without at least one Adult ticket",
                exception.getMessage());
    }

    @Test
    public void testPurchaseExceedingMax25TicketsThrowsException() {
        TicketTypeRequest adult20 = new TicketTypeRequest(Type.ADULT, 20);
        TicketTypeRequest child6 = new TicketTypeRequest(Type.CHILD, 6); // total = 26

        assertThrows(InvalidPurchaseException.class, () -> {
            ticketService.purchaseTickets(1L, adult20, child6);
        });

        verifyNoInteractions(paymentService);
        verifyNoInteractions(seatService);
    }
}