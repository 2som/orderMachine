const prompt = require('prompt-sync')({sigint: true});

const exampleUsage = (machine) => {
    console.log('press "x" to exit');
    while(true){
        machine.start();
        let nextTransition = prompt('type in next action: ');

        if((nextTransition.toUpperCase() === 'ADDPRODUCT' || nextTransition.toUpperCase() === 'REMOVEPRODUCT') 
            && machine.state.value === 'assemblingOrder')
        {
            console.log('availabe products: burger, fries, coke');
            let product = prompt('type in product name:', );
            machine.send(nextTransition.toUpperCase(), {productName: product.toLowerCase()});
        }else if(nextTransition === 'x'){
            break;
        }
        else{
            machine.send(nextTransition.toUpperCase());
        }
    }

}

module.exports = exampleUsage;