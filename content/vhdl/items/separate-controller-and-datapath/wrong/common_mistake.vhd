library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,start:in std_logic;
    amount:in std_logic_vector(7 downto 0);
    busy,done:out std_logic;
    dispensed:out std_logic_vector(7 downto 0));
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal busy_r,done_r:std_logic:='0';
    signal disp,remaining:unsigned(7 downto 0):=(others=>'0');
    begin
    busy<=busy_r;
    done<=done_r;
    dispensed<=std_logic_vector(disp);
    process(clk)begin if rising_edge(clk)then if reset='0'then busy_r<='0';
        done_r<='0';
        disp<=(others=>'0');
        remaining<=(others=>'0');
    else done_r<='0';
        if busy_r='0'and start='1'then disp<=(others=>'0');
            remaining<=unsigned(amount);
            if unsigned(amount)=0 then done_r<='1';
            else busy_r<='1';
            end if;
        elsif busy_r='1'then disp<=disp+1;
            if remaining=1 then remaining<=(others=>'0');
                busy_r<='0';
                done_r<='1';
            else remaining<=remaining-1;
            end if;
        end if;
    end if;
end if;
end process;
end architecture;
