package com.customersupport.caseservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** RabbitMQ exchange and queue declarations for case-service. */
@Configuration
public class RabbitMqConfig {

    @Value("${app.rabbitmq.case-events-exchange:case-events}")
    private String caseEventsExchange;

    @Value("${app.rabbitmq.agent-events-exchange:agent-events}")
    private String agentEventsExchange;

    @Value("${app.rabbitmq.agent-found-queue:case.agent-found}")
    private String agentFoundQueue;

    @Bean
    public TopicExchange caseEventsExchange() {
        return ExchangeBuilder.topicExchange(caseEventsExchange).durable(true).build();
    }

    @Bean
    public TopicExchange agentEventsExchange() {
        return ExchangeBuilder.topicExchange(agentEventsExchange).durable(true).build();
    }

    @Bean
    public Queue agentFoundQueue() {
        return QueueBuilder.durable(agentFoundQueue).build();
    }

    @Bean
    public Binding agentFoundBinding(Queue agentFoundQueue, TopicExchange agentEventsExchange) {
        return BindingBuilder.bind(agentFoundQueue).to(agentEventsExchange).with("agent.candidates");
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, Jackson2JsonMessageConverter conv) {
        RabbitTemplate template = new RabbitTemplate(cf);
        template.setMessageConverter(conv);
        template.setMandatory(true);
        return template;
    }
}
