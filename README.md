# treechat.ai - A quickly deployable chatbot for queries on data that differs in each deployment, may be unstructured or unclean and requires logical reasoning in order to be usefull to the user.

## Description
Applications often contain unstructured data that does not encapsulate all aspects of a concept. For example, a simple keyword search in a restaurant database for 'fast food' may not result in 'McDonald's,' despite the association being obvious to a human. This gap between structured data and human-like understanding can be bridged with advanced AI solutions like GPT.

By applying Chat-GPT and feeding it all available data, we can emulate human-like cognitive abilities and improve the efficiency of data retrieval. These models can infer some connections within data that are not explicitly defined, making them a valid choice for handling unstructured data.

A practical application for this solution is in the retail industry, specifically within shopping malls. Malls often contain diverse, obscure, and local stores, and their data might not be fully comprehensive. Furthermore, mall staff are often more adept at dealing with natural language inquiries rather than navigating databases.

In such situations, implementing treechat can enhance information retrieval, improve customer service, and provide more accurate responses to queries. By leveraging natural language understanding, we can create a more intuitive and efficient system that is capable of managing complex and incomplete data sets.

## Features in mall app
Example Queries:
- Where can I find a leather jacket?
- I am hungry, where can I get a coffee?
- What time does the mall close tonight?
- Are there any vegetarian restaurants in this mall?
- What events or promotions are happening in the mall today?

Try these out at [treechat.de](https://treechat.de/pasingerarcaden)!

In the current implementation (as of April 2023) for the [Pasigner Arcaden](https://goo.gl/maps/recjCyiqaSfVi4Uy5) the chatbot can be querried for Opening Times, Product Categories and Events/Promotions.

## Technical Implementation
For the Backend I used a Node.js Server hosted on Google App Engine as well as Firebase for as a Database (Chats, Session Info, etc.). During a chat the backend wraps the user request with the data from the data base, adds some prompts and then makes a API call to the OpenAI API. The chat itself is visualised using [BotUI](https://botui.org).

The Data about the Pasinger Arcaden is in a '.csv'-File in the [modules/pasingerarcaden folder](modules/pasingerarcaden). 

Disclaimer: This is my first node.js project and my first time doing web-development. There are probably numerous mistakes in the code.

## Deployment
The Project was designed in a way so that it is fairly easy to edit the data and also add new applications.

## Lessons learned
The biggest challenge in this project was to stop GPT from hallucinating. E.g. asking it for the way to the bathroom will generate a response which is almost definetly wrong (Interestingly it was able to generate an accurate description of the way from the S-Bahn Station to the Mall one time). Also some of the inferences of what a store sells where plain out wrong, even when the data was labeled correctly. 
Because of this high inconsistency the project was deemed as not viable.
