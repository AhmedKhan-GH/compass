library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(clk,reset,request,clear:in std_logic;
    stop,caution,go:out std_logic);
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    type state_t is (stopped,moving,cautious);
    signal state,next_state:state_t:=stopped;
    begin
    process(all)begin next_state<=state;
        case state is when stopped=>if request='1'then next_state<=moving;
        end if;
    when moving=>if clear='1'then next_state<=cautious;
    end if;
when cautious=>next_state<=stopped;
end case;
end process;
process(clk)begin if rising_edge(clk)then if reset='0'then state<=stopped;
else state<=next_state;
end if;
end if;
end process;
stop<='1'when state=stopped else '0';
go<='1'when state=moving else '0';
caution<='1'when state=cautious else '0';
end architecture;
