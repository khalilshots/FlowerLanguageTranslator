import re
from nltk.tokenize import WordPunctTokenizer



################################################################################ VARIABLS INITIALIZATION ########################################################################################

# Variable to hold the name of the output file to in which we store the tokens



log_file = './LOGS/flower.log'


output_file = 'tokens.txt'



#Tokens in our token table, each token is represented as a tuple (token, regex, id):
Tokens_table = [

    # Reserve words
        ('IF'       , '^if$'      , 1),
        ('ELSE'     , '^else$'    , 2),
        ('FOR'      , '^for$'     , 3),
        ('OUTPUT'   , '^output$'  , 4),
        ('NULL'     , '^null$'    , 5),
        ('BREAK'    , '^break$'   , 6),
        ('INT'      , '^int$'     , 7),
        ('ENUM'     , '^enum$'    , 8),

    # Punctuation
        ('LPAREN'   , '\('        , 9),
        ('RPAREN'   , '\)'        , 10),
        ('COMMA'    , ','         , 11),
        ('LBRACK'   , '\['        , 13),
        ('RBRACK'   , '\]'        , 14),
        ('LCURL'    , '\{'        , 15),
        ('RCURL'    , '\}'        , 16),
        ('SEMICOLON', ';'         , 17),
        ('NEWLINE'  , '\\n'        , 18),
        ('COMMENT'  , '(\/\/).*'  , 19),

    # Operators
        ('PLUS'     , '\+'      , 20),
        ('MINUS'    , '-'       , 21),
        ('EQUAL'    , '=='      , 22),
        ('ASSIGN'   , '='       , 23),
        ('LESS'     , '<'       , 24),
        ('MORE'     , '>'       , 25),
        ('ELESS'    , '<='      , 26),
        ('EMORE'    , '>='      , 27),
        ('DIFF'     , '!='      , 28),
        ('MULT'     , '\*'      , 29),
        ('DIV'      , '\/'      , 30),

    # Built in Functions
        ('PEEK'     , 'peek$'        , 31),
        ('PICK'     , 'pickFlower$'  , 32),
        ('UP'       , 'moveUp$'      , 33),
        ('DOWN'     , 'moveDown$'    , 34),
        ('LEFT'     , 'moveLeft$'    , 35),
        ('RIGHT'    , 'moveRight$'   , 36),
        ('PUTF'     , 'putFlower$'   , 37),
        ('PUTG'     , 'putGrass$'    , 38),
        ('PUTB'     , 'putBarrier$'  , 39),
        ('PUTP'     , 'putPicker$'   , 40),
        ('PUTE'     , 'putExit$'     , 41),
        ('CHECK'    , 'check$'       , 42),
        ('GIVEUP'   , 'giveUp$'      , 43),
        
    # Built in Constants
        ('DEPTH'   , 'depth$'    , 44),
        ('WIDTH'   , 'width$'    , 45),
        ('GARDEN'   , 'garden$'    , 46),


    # User defined identifiers
        ('FLOWER'   , '^flower$',    47),
        ('GRASS'    , '^grass$',     48),
        ('BARRIER'  , '^barrier$',   49),
        ('EMPTY'    , '^empty$',     50),
        ('PICKER'   , '^picker$',    51),
        ('EXIT'     , '^exit$',     52),
        ('VAR'      , '([a-zA-Z][0-9]*)+'       , 53),
        ('INTEGER'  , '[0-9]+'                  , 54),
        ]

#Symbol Table initialized to hold all the reserved words
ST = [
    'if'            ,
    'else'          ,
    'for'           ,
    'output'        ,
    'null'          ,
    'break'         ,
    'int'           ,
    'enum'          ,
    'peek$'         ,
    'pickFlower$'   ,
    'moveUp$'       , 
    'moveDown$'     , 
    'moveLeft$'     , 
    'moveRight$'    , 
    'putFlower$'    , 
    'putGrass$'     , 
    'putBarrier$'   , 
    'putPicker$'    , 
    'putExit$'      , 
    'check$'        , 
    'giveUp$'
    
]

#variable Table to hold all user defined vars
VT = [] 






tokenizer = WordPunctTokenizer()


#################################################################################################################################################################################################
def lex(path: str, code_file: str):

    out = open(output_file, 'w')
    out.write('')
    out.close()


    log_path = './logs/'+code_file
    log = open(log_path+'.log', 'a')


    try:
        f = open(path+code_file)                #Opening the file we want to lexically analyze
        code_lines = f.readlines()
        f.close()
    except:
            log.write("ERROR COULD NOT OPEN FILE: "+code_file)
            quit()
        

    log.write('LEXING FILE: ' +code_file +'\n\n')
    log.write('PRINTING THE TOKENS OF THE FILE:\n')

    line_num = 1                            #Keeping track of the line number
    for code_line in code_lines:

        if code_line[:2] == '//':
            continue

        code_line_tokens = tokenizer.tokenize(code_line)        #Tokenizing each line in the input file

        for tk in code_line_tokens:         #Looking up each token in the token table
            LOOKUP(tk, line_num, './logs/'+code_file, log)

        line_num += 1
    
    log.write("\nPRINTING THE VAR TABLE:\n")
    
    for var in VT:
        log.write('variable symbole: '+var+'\n')
    log.close()
    return VT






################################################################################ UTILITY FUNCTIONS ##############################################################################################

def LOOKUP(token:str, line_num:int, logging_path:str, log):

    out = open(output_file, 'a')        #Opening the file we will output the tokens to: tokens.txt       
       
    for tk in Tokens_table:
        if re.match(tk[1], token) :
           
            log.write('\tLine {} Token #{}: {}\n'.format(line_num, tk[2], token) )

            if tk[0] == 'VAR' and token not in VT and token not in ST :      #If we have a VAR token and its value is not in the symbol table, we add it
                VT.append(token) 

            if tk[0] == 'VAR' or tk[0] == 'INTEGER':
                out.write(str(line_num)+'\t'+str(tk[2])+'\t'+str(token)+'\n')
            elif tk[0] in ['PEEK', 'PICK', 'UP', 'DOWN' ,'LEFT', 'RIGHT', 'PUTF', 'PUTG', 'PUTB', 'PUTP', 'PUTE', 'CHECK' , 'GIVEUP' ]:
                out.write(str(line_num)+'\t'+str(tk[2])+'\t'+str(token)+'\n')
            else:
                out.write(str(line_num)+'\t'+str(tk[2])+'\t'+ tk[0]+'\n')
            return
    

#################################################################################################################################################################################################


