#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>


//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::     VARIABLES DEFINITIONS    :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

//struct to represent each datum we read from the file in the data section
typedef struct {
    char num_sym_name[3];
    int  size;
    int  val;
}data;


//struct to represent a symbole and it's memory location
typedef struct{
    data var;
    int mem_loc;
}symbole;

//the variable to hold the symbole table
symbole *ST;

//variable to keep track of the size of the symbole table
int ST_length = 0;


//variable to keep track of memory location
int memory_location = 0;







//struct to represent the label table (the label and the line it points to)
typedef struct{
	int label_name;
	int line_idx;
}label;


//the variable to hold the label table
label *LT;


//variable to keep track of the size of the symbole table
int LT_length = 0;

//array to hold instructions (code section)
char code[1000][13];

//variable to keep track of the instructions size
int code_length = 0;







//array to hold input data
int input[150];

//array to keep track track of the input array length
int input_length = 0; 

//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::






//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::     UTILITY FUNCTIONS    :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::



//Splice function takes string and returns a substring that starts from beg and has size elts
char *splice(char *str, int beg, int elts){
	char *spliced_string = malloc(elts * sizeof(char));
	for(int i = 0; i < elts; i++){ spliced_string[i] = str[beg+i];}
	spliced_string[elts] = '\0';
	return spliced_string;
}


//LOOK UP function that looks for the value stored in a variable on the symbole table
int LOOKUP(char *symbolic_name){
    for(int i = 0; i < ST_length; i++){
        if(strcmp(ST[i].var.num_sym_name, symbolic_name) == 0)  return ST[i].var.val;
    }

    printf("\n\nERROR IN LOOKUP FUNCTION!!!! COULD NOT FIND SYMBOLE WITH NAME: %s\n\n", symbolic_name);
    exit(0);
}

//STORE functions that stores a value into a memory address
void STORE(int value, int memloc){
    for(int i = 0; i < ST_length; i++){
        if(ST[i].mem_loc == memloc){ ST[i].var.val = value; return;}
    }

    printf("ERROR COULD NOT FIND MEMEORY LOCATION: %003d", memloc);
    exit(0);
}

//function to return the index of a variable in the symbole table
int getIdx(char *symbolic_name){
    for(int i = 0; i < ST_length; i++){
        if(strcmp(ST[i].var.num_sym_name, symbolic_name) == 0)  return i;
    }

    printf("\n\nERROR IN LOOKUP FUNCTION!!!! COULD NOT FIND SYMBOLE WITH NAME: %s\n\n", symbolic_name);
    exit(0);
}

//function to update the pc (aka the ip)
int getLabel_CML(char *code_line){
    int labelnm = atol(splice(code_line, 8, 3));
    for(int i = 0; i < LT_length; i++){
        if(LT[i].label_name == labelnm) return LT[i].line_idx;
    }

    printf("\n\nCOULD NOT FIND THE LABEL WITH NAME: %s EXITING...\n\n");
    exit(0);
}


//function to get the memory location of an address on the symbol table
int get_memloc_idx(int a){
    for(int i = 0; i < ST_length; i++){
        if(ST[i].mem_loc == a){ 
            return i;
        }
    }  
    
    printf("COULD NOT FIND ADDRESS ON THE SYMBOLE TABLE! EXITING...");
    exit(0);
}


//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::












//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::     OP CODES IMPLEMENTATION    :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

//Assignment function
void ASSIGN(char *code_line){
    int value = LOOKUP((splice(code_line, 2, 3)));
    STORE(value, atol(splice(code_line, 8, 3)));
}

//function to add two elements
void ADD(char *code_line){
    printf("ADDING...");
    int val1 = LOOKUP(splice(code_line, 2, 3));
    int val2 = LOOKUP(splice(code_line, 5, 3));
    STORE(val1 + val2, atol(splice(code_line, 8, 3)));
}


//function to substract two elements
void SUB(char *code_line){
    int val1 = LOOKUP(splice(code_line, 2, 3));
    int val2 = LOOKUP(splice(code_line, 5, 3));
    STORE(val1 - val2, atol(splice(code_line, 8, 3)));
}

//function to multiply two elements
void MUL(char *code_line){
    int val1 = LOOKUP(splice(code_line, 2, 3));
    int val2 = LOOKUP(splice(code_line, 5, 3));
    STORE(val1 * val2, atol(splice(code_line, 8, 3)));
}


//function to divide two elements
void DIV(char *code_line){
    int val1 = LOOKUP(splice(code_line, 2, 3));
    int val2 = LOOKUP(splice(code_line, 5, 3));
    STORE(val1 / val2, atol(splice(code_line, 8, 3)));
}


//function to check if two variable are equal
bool EQL(char *code_line){
    int val1 = LOOKUP(splice(code_line, 2, 3));
    int val2 = LOOKUP(splice(code_line, 5, 3));
    return val1 == val2;
}


//function to check if var 1 > var 2
bool GEQ(char *code_line){
    int val1 = LOOKUP(splice(code_line, 2, 3));
    int val2 = LOOKUP(splice(code_line, 5, 3));
    return val1 >= val2;
}


//LOOP function
bool LOOP(char *code_line){
    int index = getIdx(splice(code_line, 2, 3));
    ST[index].var.val += 1;
    int val1 = LOOKUP(splice(code_line, 2, 3));
    int val2 = LOOKUP(splice(code_line, 5, 3));
    return val1 < val2;

}


//function to read from array into a memory location
void RFA(char *code_line){
    int index = getIdx(splice(code_line, 2, 3));
    int memory_location = get_memloc_idx(atol(splice(code_line, 8, 3))); 
    int increment_val = LOOKUP(splice(code_line, 5, 3));
    ST[memory_location].var.val = ST[index+increment_val].var.val;
}





//function to read from array into a memory location
void RIA(char *code_line){
    int val = LOOKUP(splice(code_line, 2, 3));
    int increment_val = LOOKUP(splice(code_line, 8, 3));
    int index = getIdx(splice(code_line, 5, 3));
    ST[index+increment_val].var.val = val;
}


//Reading input from the file
void READ(char *code_line, int input_line){
    int idx = getIdx(splice(code_line, 8, 3));
    ST[idx].var.val = input[input_line];
}

//Writing to stdout
void PRINT(char *code_line){
    printf("\n\nTHE VALUE OF THE VAIABLE WITH SYMBOLIC NAME %s is: %d\n\n", splice(code_line, 2, 3), LOOKUP(splice(code_line, 2, 3)));
}


//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::























//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::     EXECUTION FUNCTION    :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
void EXECUTE(){
    printf("\nEXECUTING...\n");
    int pc = 0;
    int input_line = 0;
    while(1 && pc < code_length){
        
        //printf("we are executing: %s", code[pc]);
        char *opcode = splice(code[pc], 0, 2);
        if(strcmp(opcode, "+0") == 0){
            ASSIGN(code[pc]);

        }else if(strcmp(opcode, "+1") == 0){
            ADD(code[pc]);

        }else if(strcmp(opcode, "-1") == 0){
            SUB(code[pc]);

        }else if(strcmp(opcode, "+2") == 0){
            MUL(code[pc]);

        }else if(strcmp(opcode, "-2") == 0){
            DIV(code[pc]);

        }else if(strcmp(opcode, "+4") == 0){
            if(EQL(code[pc])){
                pc = getLabel_CML(code[pc]);
                continue;
            }
            
        }else if(strcmp(opcode, "-4") == 0){
            if(!EQL(code[pc])){
                pc = getLabel_CML(code[pc]);
                continue;
            }            

        }else if(strcmp(opcode, "+5") == 0){
            if(GEQ(code[pc])){
                pc = getLabel_CML(code[pc]);
                continue;
            }

        }else if(strcmp(opcode, "-5") == 0){
            if(!GEQ(code[pc])){
                pc = getLabel_CML(code[pc]);
                continue;
            }

        }else if(strcmp(opcode, "+6") == 0){
            RFA(code[pc]);

        }else if(strcmp(opcode, "-6") == 0){
            RIA(code[pc]);

        }else if(strcmp(opcode, "+7") == 0){
            if(LOOP(code[pc])){
                pc = getLabel_CML(code[pc]);
                continue;
            }
        }else if(strcmp(opcode, "+8") == 0){
            READ(code[pc], input_line);
            input_line++;

        }else if(strcmp(opcode, "-8") == 0){
            PRINT(code[pc]);

        }else if(strcmp(code[pc], "+9000000000\n") == 0){
                    return;

        }
        pc++;
    
    }
}











void main(){


    //checking if the file is opened 
    
    //CHANGE FILE NAME HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    FILE * program_file = fopen("loop.txt", "r");
    if(program_file == NULL){
        printf("\n\nCOULD NOT OPEN PROGRAM FILE! EXITING...\n\n");
        exit(0);
    }







    // initializing the symbole table to 500 elements;
    ST = malloc(500 * sizeof(symbole));

    // initializing the symbole table to 500 elements;
    LT = malloc(500 * sizeof(label));


    







    //reading from the file
    printf("\n\nPROGRAM FILE OPENED: READING...\n\n");

    //var to store each line of the file
    char *line = malloc(13*sizeof(char));

    int idx_line= 0;
    bool data_section = true;
    bool code_section = false;
    bool input_section = false;
    while (!feof(program_file)) {
        fgets(line, 13, program_file);
        if(data_section){

            if(strcmp(line, "+9999999999\n") == 0){
                printf("\n\nDATA SECTION IS DONE!\n\n");
                data_section = false;
                code_section = true;
                continue;
            }else{
                
                ST[ST_length].mem_loc = memory_location;
                strcpy(ST[ST_length].var.num_sym_name, splice(line, 2, 3));
                ST[ST_length].var.size = atol(splice(line, 5, 3));
                ST_length++;
                memory_location++;
                fgets(line, 13, program_file);
                int value = atol(line);
                ST[ST_length-1].var.val = value;

                if(ST[ST_length-1].var.size > 1){
                    int prev_memory_location = memory_location;
                    memory_location += ST[ST_length-1].var.size-1;
                    for(int i = prev_memory_location; i < memory_location; i++){
                        ST[ST_length].mem_loc = i;
                        ST[ST_length].var.size = 1;
                        ST[ST_length].var.val = value;
                        ST_length++;
                    }
                } 
              

            
            }
        }
        else if(code_section){
            
            if(strcmp(line, "+9999999999\n") == 0){
                printf("\n\nCODE SECTION IS DONE!\n\n");
                code_section = false;
                input_section = true;
            }else if(strcmp(splice(line, 0, 2) ,"-7") == 0){
                LT[LT_length].label_name = atol(splice(line, 8, 3));
                LT[LT_length].line_idx = idx_line;
                LT_length++;
            }else{
                strcpy(code[idx_line], line);
                idx_line++;
                code_length++;
            }

        }
        else if(input_section){
            input[input_length] = atol(line);
            input_length++;
        }
    }
    printf("\n\nDONE READING. FILE CLOSED.\n\n");
    fclose(program_file);
    printf("\n\nDISPLAYING THE SYMBOLE TABLE ST:\n\n");
    printf("\nvar name\t|size\t|memory_location\t|val\n");
    for(int i = 0 ; i < ST_length; i++){
        printf("\n%s\t\t|%d\t|%003d\t\t\t|%d\n", ST[i].var.num_sym_name, ST[i].var.size, ST[i].mem_loc, ST[i].var.val);
    }
    printf("\n\nDISPLAYING THE LABEL TABLE LT:\n\n");
    printf("\nlabel\t|line index pointed to\n");
    for(int i = 0; i < LT_length; i++){
        printf("\n%d\t|%d\n", LT[i].label_name, LT[i].line_idx);
    }
    printf("\n\nDISPLAYING THE INSTRUCTIONS:\n\n");
    for(int i = 0; i < code_length; i++){
        printf("%s\n", code[i]);
    }
    printf("\n\nDISPLAYING THE INPUT DATA:\n\n");
    for(int i = 0; i < input_length; i++){
        printf("%d\n", input[i]);
    }


    //Executing instructions
    EXECUTE();
    printf("\n\nDONE EXECUTING.\n\n");  
    
}