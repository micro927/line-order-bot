# LINE ORDER BOT
Stop copy previous order textbox and add yours. that's make your Chat room so Messy!!<br>
Just type your order and This Chatbot will take your order and do a summary for you and your friend!

# RUN THIS
docker run -d -p 127.0.0.1:4040:4040 --net=host --name my-ngrok -e NGROK_AUTHTOKEN= ngrok/ngrok http 4000

docker run --network=mynetwork -d -p 127.0.0.1:8022:80 --name mynginx nginx

docker run -it -d -p 4040:4040 --name my-ngrok -e NGROK_AUTHTOKEN= ngrok/ngrok http 4000

docker run --net=host -d -it --name my-ngrok -e NGROK_AUTHTOKEN= ngrok/ngrok http 4000

docker run -it -p 4040:4040 -e NGROK_AUTHTOKEN= ngrok/ngrok http 4000
