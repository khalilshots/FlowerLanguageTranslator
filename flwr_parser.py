import re

######################################## the class parse tree #################################################
class ConcreteParseTreeNode():

    # Initializing the node of a Tree
    def __init__(self, data):
        self.data =  data
        self.children = []
        self.parent = None


    # Adding a child node to a node in the tree
    def add_child(self, child):
        child.parent = self
        self.children.append(child)


   
    # Printing the Parse tree
    def printConcreteParseTree(self):
        pass

    # Print children
    def printChildren(self):
        for child in self.children :
            if child != None:
                print(child.data)




    def get_level(self):
        level = 0
        p = self.parent
        while p:
            level += 1
            p = p.parent

        return level

    def print_concrete_tree(self, log):
        spaces = ' ' * self.get_level() * 3
        prefix = spaces + "|____" if self.parent else ""
        log.write(prefix + self.data+'\n')
        if self.children:
            for child in self.children:
                child.print_concrete_tree(log)
############################################################################################################




class AbstractParseTreeNode():

    # Initializing the node of a Tree
    def __init__(self, data):
        self.data =  data
        self.children = []
        self.parent = None


    # Adding a child node to a node in the tree
    def add_child(self, child):
        child.parent = self
        self.children.append(child)


   
    # Printing the Parse tree
    def printAbstractParseTree(self):
        pass

    # Print children
    def printChildren(self):
        for child in self.children :
            if child != None:
                print(child.data)

    def changeName(self, newData):
        self.data = newData


    def get_level(self):
        level = 0
        p = self.parent
        while p:
            level += 1
            p = p.parent

        return level

    def print_abstract_tree(self, log):
        spaces = ' ' * self.get_level() * 3
        prefix = spaces + "|____" if self.parent else ""
        log.write(prefix + self.data+'\n')
        if self.children:
            for child in self.children:
                child.print_abstract_tree(log)






######################################## GENERAL STUFF #################################################

input_file = 'tokens.txt'   


current_token = 0
token_lines = []


log_file = './LOGS/flower.log'

global ST
ST = []

############################################################################################################


_START = AbstractParseTreeNode("START")
_empty = AbstractParseTreeNode("")

global ETYPE
ETYPE = ['FLOWER' ,'GRASS'  ,'BARRIER' ,'EMPTY'  ,'PICKER']
global expected_token





def WIDTH_DEC(_nonTerminal : ConcreteParseTreeNode):
    global current_token
    global expected_token


    if token_lines[current_token][2] != 'INT':
        expected_token = 'INT'
        return False
    current_token =  current_token + 1

    if token_lines[current_token][2] != 'WIDTH':
        expected_token = 'WIDTH'
        return False
    current_token =  current_token + 1

    if token_lines[current_token][2] != 'ASSIGN':
        expected_token = 'ASSIGN'
        return False
    current_token =  current_token + 1

    if type(int(token_lines[current_token][2])) != int:
        expected_token = 'INTEGER'
        return False

    current_token =  current_token + 1

    if token_lines[current_token][2] != 'SEMICOLON':
        expected_token = 'SEMICOLON'
        return False
    current_token =  current_token + 1

    _WidthDec = ConcreteParseTreeNode("<widthDec>")
    _nonTerminal.add_child(_WidthDec)
    _Assign = AbstractParseTreeNode("ASSIGN")
    _START.add_child(_Assign)
    _Assign.add_child(AbstractParseTreeNode("INT"))
    _Assign.add_child(AbstractParseTreeNode("WIDTH"))
    _Assign.add_child(AbstractParseTreeNode("INTEGER"))
    _Assign.add_child(AbstractParseTreeNode("SEMICOLON"))


    _WidthDec.add_child(ConcreteParseTreeNode("INT"))
    _WidthDec.add_child(ConcreteParseTreeNode("WIDTH"))
    _WidthDec.add_child(ConcreteParseTreeNode("ASSIGN"))
    _WidthDec.add_child(ConcreteParseTreeNode("INTEGER"))
    _WidthDec.add_child(ConcreteParseTreeNode("SEMICOLON"))

    return True


def DEPTH_DEC(_nonTerminal : ConcreteParseTreeNode):
    global current_token
    global expected_token


    if token_lines[current_token][2] != 'INT':
        expected_token = 'INT'
        return False
    current_token =  current_token + 1

    if token_lines[current_token][2] != 'DEPTH':
        expected_token = 'DEPTH'
        return False
    current_token =  current_token + 1

    if token_lines[current_token][2] != 'ASSIGN':
        expected_token = 'ASSIGN'
        return False
    current_token =  current_token + 1

    if type(int(token_lines[current_token][2])) != int:
        expected_token = 'INTEGER'
        return False
    current_token =  current_token + 1

    if token_lines[current_token][2] != 'SEMICOLON':
        expected_token = 'SEMICOLON'
        return False
    current_token =  current_token + 1

    _DepthDec = ConcreteParseTreeNode("<depthDec>")
    _nonTerminal.add_child(_DepthDec)
    _Assign = AbstractParseTreeNode("ASSIGN")
    _START.add_child(_Assign)
   
   
    _Assign.add_child(AbstractParseTreeNode("INT"))
    _Assign.add_child(AbstractParseTreeNode("DEPTH"))
    _Assign.add_child(AbstractParseTreeNode("INTEGER"))
    _Assign.add_child(AbstractParseTreeNode("SEMICOLON"))



    _DepthDec.add_child(ConcreteParseTreeNode("INT"))
    _DepthDec.add_child(ConcreteParseTreeNode("DEPTH"))
    _DepthDec.add_child(ConcreteParseTreeNode("ASSIGN"))
    _DepthDec.add_child(ConcreteParseTreeNode("INTEGER"))
    _DepthDec.add_child(ConcreteParseTreeNode("SEMICOLON"))

    return True





def DATA_TYPE(_nonTerminal, _parent):
    global current_token
    global expected_token
    if token_lines[current_token][2] in ['ENUM', 'INT']:
        _DataType =  ConcreteParseTreeNode("<dataType>")
        _nonTerminal.add_child(_DataType)
        _type =  AbstractParseTreeNode(token_lines[current_token][2])
        _parent.add_child(_type)
        _DataType.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        current_token =   current_token + 1
        return True

    return False

    

def VAR_DEC(_nonTerminal, _parent):
 
  global current_token
  global expected_token
  global ST
 
  _VarDec = ConcreteParseTreeNode("<varDec>")
  _nonTerminal.add_child(_VarDec)
  _var = AbstractParseTreeNode("//")
  _parent.add_child(_var)




  if not DATA_TYPE(_VarDec, _var):
    return False
  if not (token_lines[current_token][2] in ST or token_lines[current_token][2] == 'GARDEN'):
    expected_token = 'VAR'
    return False 
    
  _var.changeName(token_lines[current_token][2] )
  _VarDec.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
  current_token = current_token + 1
  
  if token_lines[current_token][2] == 'LBRACK':
    ARRAY_DEC(_VarDec, _var)

  elif token_lines[current_token][2] == 'ASSIGN':
    _VarDec.add_child(ConcreteParseTreeNode('ASSIGN'))
    _var.add_child(AbstractParseTreeNode('ASSIGN'))
    current_token = current_token + 1

    if type(int(token_lines[current_token][2])):
      VALUE(_VarDec, _var)
    elif token_lines[current_token][2] in ST:
      _VarDec.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
      _var.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
      current_token = current_token + 1
    else:
      return False
 
 
  if token_lines[current_token][2] != 'SEMICOLON':
    expected_token = 'SEMICOLON'
    return False
  _VarDec.add_child(ConcreteParseTreeNode('SEMICOLON'))
  _var.add_child(AbstractParseTreeNode('SEMICOLON'))
  current_token = current_token + 1
 
  return True



def program(log):
    _program = ConcreteParseTreeNode("<proram>")
    global ST
   

    global current_token
    global expected_token
    if not WIDTH_DEC(_program):
        return False
    if not DEPTH_DEC(_program):
        return False

    while token_lines[current_token][2] in ['ENUM', 'INT']:
        if not VAR_DEC(_program, _START):
            return False

    if not MAKE_GARDEN(_program):
        return False

    if not LOGIC(_program):    
        return False
    log.write("\nPRINTING THE CST: \n")
    _program.print_concrete_tree(log)
    
    return True



def ARRAY_DEC(_nonTerminal, _parent):
 
  global current_token
  global expected_token
  _ArrayDec = ConcreteParseTreeNode("<arrayDec>")
  _size = AbstractParseTreeNode('//')
  _nonTerminal.add_child(_ArrayDec)

  if token_lines[current_token][2] != 'LBRACK':
    expected_token = 'LBRACK'
    return False
  _ArrayDec.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
  _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
  current_token = current_token + 1
 
 
 
  if not (token_lines[current_token][2] in ['DEPTH', 'WIDTH'] or type(int(token_lines[current_token][2]))):
    expected_token = ['INTEGER', 'DEPTH', 'WIDTH']
    return False
  _ArrayDec.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
  _size.changeName(token_lines[current_token][2] )
  _size.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
  current_token = current_token + 1
 
 
 
 
  if token_lines[current_token][2] != 'RBRACK':
    expected_token = 'RBRACK'
    return False
  _ArrayDec.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))  
  _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
  current_token = current_token + 1

 
 
 
  if token_lines[current_token][2] == 'LBRACK':
    _ArrayDec.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token = current_token + 1


    if not token_lines[current_token][2] in ['INTEGER', 'DEPTH', 'WIDTH']:
        expected_token = ['INTEGER', 'DEPTH', 'WIDTH']
        return False
    _ArrayDec.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token = current_token + 1


    if token_lines[current_token][2] != 'RBRACK':
        expected_token = 'RBRACK'
        return False
    _ArrayDec.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token = current_token + 1


  return True


def VALUE(_nonTerminal, _parent):
    global current_token
    global expected_token
    global ETYPE

    _Value = ConcreteParseTreeNode("<value>")
    _nonTerminal.add_child(_Value)
    _val = AbstractParseTreeNode(token_lines[current_token][2])
    _parent.add_child(_val)




    if token_lines[current_token][2]  in ETYPE or type(int(token_lines[current_token][2]))==int:

        _Value.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        expected_token = ['ETYPE', 'INTEGER']
        current_token = current_token + 1
        return True

    return False



def STATEMENT(_nonTerminal, _parent):
    global current_token
    global expected_token
    global ST
    _Statement = ConcreteParseTreeNode('<statement>')
    _nonTerminal.add_child(_Statement)
    if token_lines[current_token][2] == 'IF':
        if not SELECTION(_Statement, _parent):
            return False
        return True
    elif token_lines[current_token][2] == 'FOR':
        if not LOOP(_Statement, _parent):
            return False
        return True
    elif token_lines[current_token][2] in ST:
        if not EXPRESSION(_Statement, _parent):
            return False
        return True
    elif token_lines[current_token][2] == 'LPAREN':
        if not FUNCTION_CALL(_Statement, _parent):
            return False
        return True
    elif VAR_DEC(_Statement, _parent):
        return True
    else:
        return False



def SELECTION(_nonTerminal, _parent):
    global current_token
    global expected_token
    global ST
    _Selection = ConcreteParseTreeNode("<selection>")
    _nonTerminal.add_child(_Selection)
    _IF = AbstractParseTreeNode("IF")
    _parent.add_child(_IF)

    if token_lines[current_token][2] != 'IF':
        expected_token = 'IF'
        return False
    _Selection.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    current_token = current_token + 1
   
    if token_lines[current_token][2] != 'LPAREN':
        expected_token = 'LPAREN'
        return False
    _Selection.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _IF.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1
   
    if not CONSTRAINT(_Selection, _IF):
        return False
   
    if token_lines[current_token][2] != 'RPAREN':
        expected_token = 'RPAREN'
        return False
    _Selection.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _IF.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1
   
    while token_lines[ current_token][2] in ['IF', 'FOR', 'LPAREN', 'INT', 'ENUM'] or token_lines[ current_token][2] in ST:
        if not STATEMENT(_Selection, _IF):
            return False
   
    if token_lines[current_token][2] == 'ELSE':
        current_token = current_token + 1
        STATEMENT(_Selection, _IF)
    return True
   
   

def LOOP(_nonTerminal, _parent):
    global current_token
    global expected_token

    _Loop = ConcreteParseTreeNode('<loop>')
    _nonTerminal.add_child(_Loop)
    _FOR = AbstractParseTreeNode("FOR")
    _parent.add_child(_FOR)

    if token_lines[current_token][2] != 'FOR':
        expected_token = 'FOR'
        return False
    _Loop.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))


    current_token =   current_token + 1
    if token_lines[current_token][2] != 'LPAREN':
        expected_token = 'LPAREN'
        return False
    _Loop.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _FOR.add_child(AbstractParseTreeNode(token_lines[current_token][2]))


    current_token =   current_token + 1
    if not CONSTRAINT(_Loop, _FOR):
        return False
    if token_lines[current_token][2] != 'RPAREN':
        expected_token = 'RPAREN'
        return False
    _Loop.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _FOR.add_child(AbstractParseTreeNode(token_lines[current_token][2]))


    current_token =   current_token + 1
    if token_lines[current_token][2] != 'LCURL':
        expected_token = 'LCURL'
        return False
    _Loop.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _FOR.add_child(AbstractParseTreeNode(token_lines[current_token][2]))


    current_token =   current_token + 1
    if not STATEMENT(_Loop, _FOR):
        return False
    if token_lines[current_token][2] != 'RCURL':
        expected_token = 'RCURL'
        return False
    _Loop.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _FOR.add_child(AbstractParseTreeNode(token_lines[current_token][2]))


    current_token =   current_token + 1  
    return True

def EXPRESSION(_nonTerminal, _parent):
    global current_token
    global expected_token
    global ST

    _Expression = ConcreteParseTreeNode('<expression>')
    _nonTerminal.add_child(_Expression)
    _assign = AbstractParseTreeNode('ASSIGN')
    _parent.add_child(_assign)


    if token_lines[current_token][2] not in ST:
        expected_token = 'VAR'
        return False
    _Expression.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _assign.add_child(AbstractParseTreeNode(token_lines[current_token][2]))

    current_token = current_token + 1
    if token_lines[current_token][2] != 'ASSIGN':
        expected_token = 'ASSIGN'
        return False
    _Expression.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))


    current_token = current_token + 1  

     

    if token_lines[current_token][2] in ST :
        OPERATION(_Expression, _assign)
    
    elif True:
        try:
            type(int(token_lines[current_token][2])) == int
            OPERATION(_Expression, _assign)
        except:
            return False


    elif token_lines[current_token][2] == 'LPAREN':
        FUNCTION_CALL(_Expression, _assign)


    elif token_lines[current_token] [2] == 'INT':
        _Expression.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        _assign.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
        current_token = current_token + 1 


    elif token_lines[current_token] [2] == 'WIDTH':
        _Expression.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        _assign.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
        current_token = current_token + 1 


    elif token_lines[current_token] [2] == 'DEPTH':
        _Expression.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        _assign.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
        current_token = current_token + 1 


    else:
        expected_token = ['VAR', 'INTEGER', 'ETYPE' ,'LPAREN', 'INT','WIDTH','DEPTH']
        return False


    if token_lines[current_token][2] != 'SEMICOLON':
        expected_token = 'SEMICOLON'
        return False
    _Expression.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _assign.add_child(AbstractParseTreeNode(token_lines[current_token][2]))


    current_token = current_token + 1
    return True

   

def FUNCTION_CALL(_nonTerminal, _parent):
    global current_token
    global expected_token
    global ST
    global ETYPE

    _FunctionCall = ConcreteParseTreeNode('<functionCall>')
    _nonTerminal.add_child(_FunctionCall)
    _var = AbstractParseTreeNode('//')
    _parent.add_child(_var)

    if token_lines[current_token][2] != 'LPAREN':
        expected_token = 'LPAREN'
        return False

    _FunctionCall.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _var.add_child(AbstractParseTreeNode(token_lines[current_token][2]))

    current_token = current_token + 1
    if  (token_lines[ current_token][2] != 'RPAREN') and (token_lines[current_token][2] in ETYPE  or token_lines[ current_token][2] in ST or type(int(token_lines[current_token][2]))==int):
        PARAMETER_CALL(_FunctionCall, _var)
    elif token_lines[ current_token][2] == 'RPAREN':
        pass

    if token_lines[current_token][2] != 'RPAREN':
        expected_token ='RPAREN'
        return False
    _FunctionCall.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _var.add_child(AbstractParseTreeNode(token_lines[current_token][2]))


    current_token = current_token + 1
    _var.changeName(token_lines[current_token][2])

    if FUNCTION_NAME(_FunctionCall, _empty):
       
        current_token = current_token + 1
   

    if token_lines[current_token][2] != 'SEMICOLON':
        expected_token = 'SEMICOLON'
        return False
    _FunctionCall.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _var.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token = current_token + 1
    return True

def FUNCTION_NAME(_nonTerminal, _parent):
    global current_token
    global expected_token

    _FunctionName = ConcreteParseTreeNode('<functionName>')
    _nonTerminal.add_child(_FunctionName)
    _name = AbstractParseTreeNode(token_lines[current_token][2])
    _parent.add_child(_name)  

    if token_lines[current_token][2] in ['peek', 'pickFlower', 'moveUp', 'moveDown', 'moveLeft', 'moveRight', 'putFlower', 'putBarrier', 'putGrass', 'putExit', 'putPicker', 'check', 'giveUp']:
        _FunctionName.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        return True
   
    expected_token = ['peek', 'pickFlower', 'moveUp', 'moveDown', 'moveLeft', 'moveRight', 'putFlower', 'putBarrier', 'putGrass', 'putExit', 'putPicker', 'check', 'giveUp']
    return False
   

def PARAMETER_CALL(_nonTerminal, _parent):
    global current_token
    global expected_token
    global ST

    _ParameterCall = ConcreteParseTreeNode('<parameterCall>')
    _nonTerminal.add_child(_ParameterCall)


    if token_lines[current_token][2] in ST:
        _ParameterCall.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
        current_token = current_token + 1


    elif token_lines[current_token][2]  in ETYPE or type(int(token_lines[current_token][2])) == int :
        VALUE(_ParameterCall, _parent)

    else:
        expected_token = ['VAR','INTEGER','ETYPE']
        return False


    while token_lines[current_token][2] == 'COMMA':
        _ParameterCall.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
        current_token = current_token + 1


        if token_lines[current_token][2] in ST:
            _ParameterCall.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
            _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
            current_token = current_token + 1


        elif token_lines[current_token][2]  in ETYPE or type(int(token_lines[current_token][2]))==int  :
            VALUE(_ParameterCall, _parent)

        else:
            expected_token = ['VAR','INTEGER','ETYPE']
            return False

    return True




def OPERATION(_nonTerminal, _parent):
    global current_token
    global expected_token
    global ETYPE


    _Operation = ConcreteParseTreeNode('<operation>')
    _nonTerminal.add_child(_Operation)
    _op = AbstractParseTreeNode('//')

    if token_lines[current_token][2] in ST:
        _Operation.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
        current_token = current_token + 1

    elif token_lines[current_token][2]  in ETYPE or type(int(token_lines[current_token][2]))==int :
        VALUE(_Operation, _parent)

    else:
        expected_token = ['VAR','INTEGER','ETYPE']
        return False


    while token_lines[current_token][2] in ['MULT', 'DIV', 'MINUS', 'PLUS']:
        _op.changeName(token_lines[current_token][2])
        if not ARITHOP(_Operation, _op):
            return False

        if token_lines[current_token][2] in ST:
            _parent.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
            _Operation.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
            current_token = current_token + 1 

        elif token_lines[current_token][2]  in ETYPE or type(int(token_lines[current_token][2]))==int :
            VALUE(_Operation, _parent)

        else:
            expected_token = ['VAR','INTEGER','ETYPE']
            return False 
    return True


def ARITHOP(_nonTerminal, _parent):
    global current_token
    global expected_token

    _Arithop = ConcreteParseTreeNode('<arithop>')
    _nonTerminal.add_child(_Arithop)
    _op = AbstractParseTreeNode(token_lines[current_token][2])
    _parent.add_child(_op)

    if not token_lines[current_token][2] in ['MULT', 'DIV', 'MINUS', 'PLUS']:
        expected_token = ['MULT', 'DIV', 'MINUS', 'PLUS']
        return False
    _Arithop.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1

    return True


def LOGIC(_nonTerminal):
    global current_token
    global expected_token

    _Logic = ConcreteParseTreeNode('<logic>')
    _nonTerminal.add_child(_Logic)

    if token_lines[current_token][2] != 'LCURL':
        expected_token = 'LCURL'
        return False
    _Logic.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _START.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1


    while token_lines[ current_token][2] in ['IF', 'FOR','LPAREN', 'INT', 'ENUM'] or  token_lines[ current_token][2] in  ST:
        if not STATEMENT(_Logic, _START):
            return False

    if token_lines[current_token][2] != 'RCURL':
        expected_token = 'RCURL'
        return False
   
    _Logic.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _START.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1


    return True

def MAKE_GARDEN(_nonTerminal):
    global current_token
    global expected_token

    _MakeGarden = ConcreteParseTreeNode('<makeGarden>')
    _nonTerminal.add_child(_MakeGarden)
   
   
    if token_lines[current_token][2] != 'LCURL':
        expected_token = 'LCURL'
        return False
    _MakeGarden.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _START.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1


    while token_lines[current_token][2] == 'LPAREN':
        if not FUNCTION_CALL(_MakeGarden, _START):
            return False

    if token_lines[current_token][2] != 'RCURL':
        expected_token = 'RCURL'
        return False
    _MakeGarden.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _START.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1

    return True
   


def RETURN(_nonTerminal, _parent):
    global current_token
    global expected_token

    _Return = ConcreteParseTreeNode('<return>')
    _nonTerminal.add_child(_Return)
    _rtrn = AbstractParseTreeNode('RETURN')
    _parent.add_child(_rtrn)



    if token_lines[current_token][2] != 'RETURN':
        expected_token = 'RETURN'
        return False
    _Return.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1


    if token_lines[current_token][2] in ST:
        _Return.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
        _rtrn.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
        current_token = current_token + 1


    elif not VALUE(_Return, _rtrn):
        return False
    if token_lines[current_token][2] != 'SEMICOLON':
        expected_token = 'SEMICOLON'
        return False
    _Return.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _rtrn.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1

    return True
       
def OPERATORS(_nonTerminal, _parent):
    global current_token
    global expected_token

    _Operators = ConcreteParseTreeNode('<operators>')
    _nonTerminal.add_child(_Operators)
    _ops = AbstractParseTreeNode(token_lines[current_token][2])
    _parent.add_child(_ops)

    if not token_lines[current_token][2] in ['EQUAL', 'LESS', 'MORE', 'ELESS', 'EMORE','DIFF']:
        expected_token = ['EQUAL', 'LESS', 'MORE', 'ELESS', 'EMORE','DIFF']
        return False
    _Operators.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1

    return True

def CONSTRAINT(_nonTerminal, _parent):
    global current_token
    global expected_token
    global ST
    global ETYPE

    _Constraint = ConcreteParseTreeNode('<constraint>')
    _nonTerminal.add_child(_Constraint)
    _operator = AbstractParseTreeNode("//")
    _parent.add_child(_operator)

   
    if not (token_lines[current_token][2] in ['WIDTH', 'DEPTH'] or token_lines[ current_token][2] in ST):
        expected_token = ['VAR', 'WIDTH', 'DEPTH']
        return False
    _Constraint.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _operator.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token =   current_token + 1
   
    _operator.changeName(token_lines[current_token][2])
    if not OPERATORS(_Constraint, _empty):
        return False
   
    if not (token_lines[current_token][2]  in ETYPE or  token_lines[ current_token][2] in ST or type(int(token_lines[current_token][2])) == int):
        expected_token = ['VAR', 'INTEGER', 'ETYPE']
        return False 
    _Constraint.add_child(ConcreteParseTreeNode(token_lines[current_token][2]))
    _operator.add_child(AbstractParseTreeNode(token_lines[current_token][2]))
    current_token = current_token + 1
    return True






def parse(SymboleT, code_file):

    global ST
    global expected_token
    ST = SymboleT

    log_path = './logs/'+code_file
    log = open(log_path+'.log', 'a')

    log.write("PARSING FILE: "+code_file)

    inp = open(input_file, 'r')
    global token_lines
    global current_token
    current_token = 0
    token_lines = inp.readlines()
    inp.close()
    for i in range(0, len(token_lines)):
        token_lines[i] = re.sub('\n','', token_lines[i])

    for i in range(0, len(token_lines)):
        token_lines[i]= token_lines[i].split("\t")
    
    if not program(log):
        log.write("ERROR EXPECTED TOKEN: "+str(expected_token))
        return
    else:
        log.write("\nPRINTING THE AST: \n")
        _START.print_abstract_tree(log)
