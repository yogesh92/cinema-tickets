package uk.gov.dwp.uc.pairtest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import thirdparty.paymentgateway.TicketPaymentService;
import thirdparty.seatbooking.SeatReservationService;
import uk.gov.dwp.uc.pairtest.domain.TicketTypeRequest;
import uk.gov.dwp.uc.pairtest.domain.TicketTypeRequest.Type;

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
        // Given
        TicketTypeRequest adult = new TicketTypeRequest(Type.ADULT, 1);

        // When
        ticketService.purchaseTickets(1L, adult);

        // Then
        verify(paymentService).makePayment(1L, 25);
        verify(seatService).reserveSeat(1L, 1);
    }
}