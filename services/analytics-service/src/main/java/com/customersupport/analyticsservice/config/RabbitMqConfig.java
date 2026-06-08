package com.customersupport.analyticsservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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

    /** Bind to ALL case.* events — analytics wants every state change. */
    @Bean
    public Binding bindAll(Queue caseEventsQueue, TopicExchange caseEventsExchange) {
        return BindingBuilder.bind(caseEventsQueue).to(caseEventsExchange).with("case.#");
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
