import os
import flwr_lexer
import flwr_parser

path = "./test_suit/"
log_path = './logs'
answer = 'Y'
for code_file in os.listdir(path):
        out = open(log_path+'/'+code_file+'.log', 'w')  
        out.write("TRANSLATING FILE: "+code_file+"\n\n")
        out.close()
        ST = flwr_lexer.lex(path, code_file)
        flwr_parser.parse(ST, code_file)
