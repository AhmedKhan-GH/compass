library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.trail_defs.all;
entity trail_counter is generic(WIDTH:positive:=TRAIL_COUNT_WIDTH);
    port(clk,reset,arrival:in std_logic;
    visitors:out std_logic_vector(WIDTH-1 downto 0));
end;
architecture rtl of trail_counter is signal n:unsigned(WIDTH-1 downto 0):=(others=>'0');
    begin visitors<=std_logic_vector(n);
    process(clk)begin
        if rising_edge(clk)then
            if reset='1'then n<=(others=>'0');
            elsif arrival='1'then null;
                -- TODO: count arrivals
            end if;
        end if;
    end process;
end;
