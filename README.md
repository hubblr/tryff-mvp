# Environment Variables

* copy the contents of the ```.env.example``` file into a new ```.env``` file
* fill out the environment variables in the ```.env``` file with the correct shopify / AWS / airtable keys & secrets

# Setup

After changing endpoints or lambda function code, simple run ```npm run setup```. This zips the content of the carrier
service and fulfillment webhook microservice directories, updates the AWS lambda functions with the created zip files,
and connects the services' AWS API Gateway URLs with Shopify.
