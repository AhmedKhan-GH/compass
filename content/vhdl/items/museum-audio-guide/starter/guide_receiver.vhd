library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity guide_receiver is
    port(beacon:in std_logic_vector(7 downto 0);
    stop_id,volume:out std_logic_vector(3 downto 0));
end entity;
architecture rtl of guide_receiver is
    begin
    stop_id<=beacon(7 downto 4);
    volume<=beacon(3 downto 0);
end architecture;
