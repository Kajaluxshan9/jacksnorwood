package com.jacksnorwood.jacks_backend;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class JacksBackendApplication {

	/**
	 * The restaurant's clock, for the whole application.
	 *
	 * Jack's is in Norwood, Ontario, so every stored date and time means
	 * Canadian Eastern. The entities use LocalDate/LocalTime/LocalDateTime,
	 * which carry no zone of their own, so LocalDateTime.now() — used to decide
	 * whether an event's display period is open, or whether a booking is in the
	 * past — resolves against the JVM default zone.
	 *
	 * Pinning it here rather than relying on the host means the answer cannot
	 * change because a server was provisioned in UTC or its timezone was edited.
	 * The IANA database supplies the DST rules, so EDT/EST switches on its own.
	 */
	public static final String RESTAURANT_TIME_ZONE = "America/Toronto";

	@PostConstruct
	void pinTimeZone() {
		TimeZone.setDefault(TimeZone.getTimeZone(RESTAURANT_TIME_ZONE));
	}

	public static void main(String[] args) {
		// Set before the context starts so the connection pool and JPA pick it
		// up too; @PostConstruct above keeps it right if anything resets it.
		TimeZone.setDefault(TimeZone.getTimeZone(RESTAURANT_TIME_ZONE));
		SpringApplication.run(JacksBackendApplication.class, args);
	}

}
