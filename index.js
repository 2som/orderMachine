const { Machine, interpret, actions} = require("xstate");
const exampleUsage = require('./example');

const ORDERS = []

//actions
const addProductToBasket = (context, event) => {
    let product;
    for(let entry of context.products){
        if(entry.name === event.productName){
            product = {...entry};
            break;
        }
    }
    if(product){
        console.log(`[assemblingOrder] adding ${event.productName} to basket`);
        context.order.push(product);
        console.log('current order: ', context.order);
    }
}

const removeProductFromBasket = (context, event) => {
    const index = context.order.findIndex((product) => product.name === event.productName)
    if(index !== -1){
        context.order.splice(index, 1);
        console.log('[assembingOrder] removed product:', event.productName )
        console.log('[assemblingOrder] current order', context.order)
    }else{
        console.log('product not found');
    }
}


const notifyAboutPrice = context => {
    const price = context.order.reduce((prev, next) => (prev + next.price), 0);
    console.log(`[orderSummary] total price: ${price}`);
}

const clearOrder = context => {
    context.order = [];
    console.log('[restingState] cleanup')
}

//guards
const productsInTheBasket =  context => context.order.length > 0;

const paymentSucceded = () => Math.random() >= 0.5;

const sendOrder = context => {
    ORDERS.push([...context.order]);
    console.log('transaction succeded!')
    console.log('current orders:', ORDERS)
    return true;
}

const orderMachine = Machine({
    id: 'selfService',
    context: {
        products: [
            {
                name: 'burger',
                price: 5
            },
            {
                name: 'fries',
                price: 3
            },
            {   
                name: 'coke',
                price: 4
            }
        ],
        order: [],
    },
    initial: 'restingState',
    states: {
        restingState: {
            entry: clearOrder,
            on: {
                'START':{
                    target: 'assemblingOrder'
                }
            }
        },
        assemblingOrder: {
            entry: actions.log(context => `current order: ${context.order}`),
            on: {
                'ADDPRODUCT':{
                    actions: addProductToBasket
                },
                'REMOVEPRODUCT':{
                    actions: removeProductFromBasket,
                    cond: productsInTheBasket
                },
                'CHECKOUT':[
                    {   
                        target: 'orderSummary',
                        cond: productsInTheBasket
                    }, 
                    {actions: actions.log('no products in basket')}
                ],
                'CANCEL':{
                    target: 'restingState'
                }
            }
        },
        orderSummary: {
            entry: notifyAboutPrice,
            on: {
                'CARD': {
                    target: 'cardTransaction'
                }
                ,
                'CANCEL':{
                    target: 'assemblingOrder'
                }
            }
        },
        cardTransaction: {
            entry: actions.log('[cardTransaction] activating terminal'),
            on:{
                'PAY': [
                    {   target: 'completeOrder',
                        cond: paymentSucceded,
                    }, {target: 'paymentFailure', actions: actions.log('[cardTransaction] payment failed')}
                ],
            },
            after: {30000: 'paymentFailure'},
            exit: actions.log('[cardTransaction] turning off terminal')
        },
        paymentFailure:{
            on: {
                'TRYAGAIN':{
                    target: 'orderSummary'
                },
                'CANCEL': {
                    target: 'restingState'
                },
            }, 
            after: {30000: 'restingState'}
        },
        completeOrder: {
            always: {
                target: 'restingState',
                cond: sendOrder
            }
        }
    },
});

const service = interpret(orderMachine).onTransition(state => {
    console.log('current state: ', state.value)
    console.log('available actions: ', state.nextEvents)
});;

exampleUsage(service);
