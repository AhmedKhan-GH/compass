library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (clk, reset, start_pulse : in std_logic;
    duration : in std_logic_vector(3 downto 0);
    lamp : out std_logic);
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal remaining:unsigned(3 downto 0):=(others=>'0');
    signal lamp_r:std_logic:='0';
    begin
    lamp<=lamp_r;
    process(clk) begin if rising_edge(clk) then if reset='0' then remaining<=(others=>'0');
        lamp_r<='0';
    elsif start_pulse='1' and lamp_r='0' then if unsigned(duration)=0 then remaining<=(others=>'0');
        lamp_r<='0';
    else remaining<=unsigned(duration);
        lamp_r<='1';
    end if;
elsif lamp_r='1' then if remaining=1 then remaining<=(others=>'0');
    lamp_r<='0';
else remaining<=remaining-1;
end if;
end if;
end if;
end process;
end architecture;
