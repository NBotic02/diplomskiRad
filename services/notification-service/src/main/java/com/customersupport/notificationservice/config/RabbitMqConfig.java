package com.customersupport.notificationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Declares queue, exchange and bindings for case-events. */
@Configuration
public class RabbitMqConfig {

    @Value("${app.rabbitmq.case-events-exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.case-events-queue}")
    private String queueName;

    @Bean
    public TopicExchange caseEventsExchange() {
        return ExchangeBuilder.topicExchange(exchangeName).durable(true).build();
    }

    @Bean
    public Queue caseEventsQueue() {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public Binding bindAssigned(Queue caseEventsQueue, TopicExchange caseEventsExchange) {
        return BindingBuilder.bind(caseEventsQueue).to(caseEventsExchange).with("case.assigned");
    }

    @Bean
    public Binding bindEscalated(Queue caseEventsQueue, TopicExchange caseEventsExchange) {
        return BindingBuilder.bind(caseEventsQueue).to(caseEventsExchange).with("case.escalated");
    }

    @Bean
    public Binding bindResolved(Queue caseEventsQueue, TopicExchange caseEventsExchange) {
        return BindingBuilder.bind(caseEventsQueue).to(caseEventsExchange).with("case.resolved");
    }

    @Bean
    public Binding bindSla(Queue caseEventsQueue, TopicExchange caseEventsExchange) {
        return BindingBuilder.bind(caseEventsQueue).to(caseEventsExchange).with("case.sla.#");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory cf, MessageConverter converter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(cf);
        factory.setMessageConverter(converter);
        return factory;
    }
}
