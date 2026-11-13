library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,start:in std_logic;
    a,b:in std_logic_vector(7 downto 0);
    busy,done:out std_logic;
    product:out std_logic_vector(15 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal busy_r,done_r:std_logic:='0';
    signal prod,mcand:unsigned(15 downto 0):=(others=>'0');
    signal mplier:unsigned(7 downto 0):=(others=>'0');
    signal count:unsigned(3 downto 0):=(others=>'0');
    begin
    busy<=busy_r;
    done<=done_r;
    product<=std_logic_vector(prod);
    process(clk)begin if rising_edge(clk)then if reset='0'then busy_r<='0';
        done_r<='0';
        prod<=(others=>'0');
        count<=(others=>'0');
    else done_r<='0';
        if busy_r='0'and start='1'then prod<=(others=>'0');
            mcand<=resize(unsigned(a),16);
            mplier<=unsigned(b);
            count<=(others=>'0');
            busy_r<='1';
        elsif busy_r='1'then if mplier(0)='1'then prod<=prod+mcand;
        end if;
        mcand<=shift_left(mcand,1);
        mplier<=shift_right(mplier,1);
        if count=7 then busy_r<='0';
            done_r<='1';
        end if;
        count<=count+1;
    end if;
end if;
end if;
end process;
end architecture;
