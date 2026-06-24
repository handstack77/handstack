using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

using Mediator;

using Microsoft.Extensions.DependencyInjection;

namespace HandStack.Web.ApiClient
{
    public sealed class HandStackMediator : IMediator
    {
        private readonly IServiceProvider serviceProvider;

        public HandStackMediator(IServiceProvider serviceProvider)
        {
            this.serviceProvider = serviceProvider;
        }

        public async ValueTask<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
        {
            var result = await Send((object)request, cancellationToken);
            return result is TResponse typedResult ? typedResult : default!;
        }

        public async ValueTask<TResponse> Send<TResponse>(ICommand<TResponse> command, CancellationToken cancellationToken = default)
        {
            var result = await Send((object)command, cancellationToken);
            return result is TResponse typedResult ? typedResult : default!;
        }

        public async ValueTask<TResponse> Send<TResponse>(IQuery<TResponse> query, CancellationToken cancellationToken = default)
        {
            var result = await Send((object)query, cancellationToken);
            return result is TResponse typedResult ? typedResult : default!;
        }

        public async ValueTask<object?> Send(object message, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(message);

            var messageType = message.GetType();
            var requestInterface = FindRequestInterface(messageType);
            if (requestInterface == null)
            {
                throw new InvalidOperationException($"Mediator request interface 확인 필요: {messageType.FullName}");
            }

            var responseType = requestInterface.GetGenericArguments()[0];
            var handlerType = GetRequestHandlerType(requestInterface, messageType, responseType);
            var handler = serviceProvider.GetService(handlerType);
            if (handler == null)
            {
                throw new InvalidOperationException($"Mediator request handler 확인 필요: {handlerType.FullName}");
            }

            return await InvokeHandleAsync(handler, message, cancellationToken);
        }

        public async ValueTask Publish<TNotification>(TNotification notification, CancellationToken cancellationToken = default)
            where TNotification : INotification
        {
            await Publish((object)notification, cancellationToken);
        }

        public async ValueTask Publish(object notification, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(notification);

            var notificationType = notification.GetType();
            if (!typeof(INotification).IsAssignableFrom(notificationType))
            {
                throw new InvalidOperationException($"Mediator notification interface 확인 필요: {notificationType.FullName}");
            }

            var handlerType = typeof(INotificationHandler<>).MakeGenericType(notificationType);
            foreach (var handler in serviceProvider.GetServices(handlerType))
            {
                if (handler != null)
                {
                    await InvokeNotificationHandleAsync(handler, notification, cancellationToken);
                }
            }
        }

        public IAsyncEnumerable<TResponse> CreateStream<TResponse>(IStreamQuery<TResponse> query, CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException("Stream query는 HandStack mediator에서 지원하지 않습니다.");
        }

        public IAsyncEnumerable<TResponse> CreateStream<TResponse>(IStreamRequest<TResponse> request, CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException("Stream request는 HandStack mediator에서 지원하지 않습니다.");
        }

        public IAsyncEnumerable<TResponse> CreateStream<TResponse>(IStreamCommand<TResponse> command, CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException("Stream command는 HandStack mediator에서 지원하지 않습니다.");
        }

        public IAsyncEnumerable<object?> CreateStream(object message, CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException("Stream message는 HandStack mediator에서 지원하지 않습니다.");
        }

        private static Type? FindRequestInterface(Type messageType)
        {
            return messageType.GetInterfaces()
                .FirstOrDefault(IsRequestInterface);
        }

        private static bool IsRequestInterface(Type interfaceType)
        {
            if (!interfaceType.IsGenericType)
            {
                return false;
            }

            var definition = interfaceType.GetGenericTypeDefinition();
            return definition == typeof(IRequest<>)
                || definition == typeof(ICommand<>)
                || definition == typeof(IQuery<>);
        }

        private static Type GetRequestHandlerType(Type requestInterface, Type messageType, Type responseType)
        {
            var definition = requestInterface.GetGenericTypeDefinition();
            if (definition == typeof(ICommand<>))
            {
                return typeof(ICommandHandler<,>).MakeGenericType(messageType, responseType);
            }

            if (definition == typeof(IQuery<>))
            {
                return typeof(IQueryHandler<,>).MakeGenericType(messageType, responseType);
            }

            return typeof(IRequestHandler<,>).MakeGenericType(messageType, responseType);
        }

        private static async ValueTask<object?> InvokeHandleAsync(object handler, object message, CancellationToken cancellationToken)
        {
            var method = FindHandleMethod(handler.GetType(), message.GetType());
            var result = method.Invoke(handler, new[] { message, cancellationToken });
            if (result == null)
            {
                return null;
            }

            return await AwaitValueTaskResultAsync(result);
        }

        private static async ValueTask InvokeNotificationHandleAsync(object handler, object notification, CancellationToken cancellationToken)
        {
            var method = FindHandleMethod(handler.GetType(), notification.GetType());
            var result = method.Invoke(handler, new[] { notification, cancellationToken });
            if (result is ValueTask valueTask)
            {
                await valueTask;
            }
        }

        private static MethodInfo FindHandleMethod(Type handlerType, Type messageType)
        {
            return handlerType.GetMethods()
                .FirstOrDefault(method =>
                    method.Name == "Handle"
                    && method.GetParameters() is var parameters
                    && parameters.Length == 2
                    && parameters[0].ParameterType.IsAssignableFrom(messageType)
                    && parameters[1].ParameterType == typeof(CancellationToken))
                ?? throw new InvalidOperationException($"Mediator handler Handle 메서드 확인 필요: {handlerType.FullName}");
        }

        private static async ValueTask<object?> AwaitValueTaskResultAsync(object result)
        {
            dynamic awaitable = result;
            return await awaitable;
        }
    }
}
