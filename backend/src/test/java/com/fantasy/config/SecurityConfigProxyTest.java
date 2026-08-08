package com.fantasy.config;

import com.fantasy.domain.auth.JwtService;
import com.fantasy.domain.game.GameWeekController;
import com.fantasy.domain.game.GameWeekService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GameWeekController.class)
@Import({SecurityConfig.class, TokenAuthFilter.class})
class SecurityConfigProxyTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GameWeekService gameWeekService;

    @MockBean
    private JwtService jwtService;

    @Test
    void acceptsAnApiRequestWhenTheNextProxyForwardsItsBrowserOrigin() throws Exception {
        when(gameWeekService.getAllGameweeks()).thenReturn(List.of());

        mockMvc.perform(get("/api/gameweeks")
                        .header(HttpHeaders.ORIGIN, "http://192.168.1.181:3000"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
